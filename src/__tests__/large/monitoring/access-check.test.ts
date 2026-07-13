import { test, expect } from "@playwright/test";
import { staticSites, spaSites } from "./shared";

// CI環境でのアクセス状況確認用テスト
const allSites = [...staticSites, ...spaSites];

allSites.forEach(({ service, url, requiresJapanIP }) => {
  const tag = requiresJapanIP ? "@japan" : "@global";
  test.describe(`${tag} Site Access Check`, () => {
    test(`Access check: ${service}`, async ({ page }) => {
      const isCI = !!process.env.CI;

      if (isCI && !process.env.SKIP_IP_INFO) {
        // CI環境の情報を取得
        console.log("🌍 CI Environment Info:");

        // IP情報取得
        try {
          await page.goto("https://ipinfo.io/json");
          const ipInfo = await page.textContent("pre");
          console.log(`IP Info: ${ipInfo}`);
        } catch (error) {
          console.log("Failed to get IP info");
        }
      }

      console.log(`\n🔍 Testing access to: ${service} (${url})`);

      try {
        // ページアクセスを試行
        const response = await page.goto(url, {
          waitUntil: "commit",
          timeout: 30000,
        });

        const status = response?.status() || 0;
        const statusText = response?.statusText() || "Unknown";
        const headers = (await response?.headers()) || {};

        console.log(`✅ Status: ${status} ${statusText}`);
        console.log(`📍 Final URL: ${page.url()}`);

        // ヘッダー情報
        const interestingHeaders = [
          "server",
          "cf-ray",
          "x-forwarded-for",
          "location",
          "set-cookie",
        ];
        interestingHeaders.forEach((header) => {
          if (headers[header]) {
            console.log(`📋 ${header}: ${headers[header]}`);
          }
        });

        // レスポンス内容の簡易チェック
        const title = await page.title();
        console.log(`📄 Page Title: ${title}`);

        // ブロック・エラーページの検出
        const content = await page.textContent("body");
        if (content) {
          const blockIndicators = [
            "access denied",
            "forbidden",
            "blocked",
            "unavailable",
            "geo-blocked",
            "region",
            "country",
            "location",
            "アクセスが拒否",
            "アクセスできません",
            "利用できません",
            "地域制限",
            "国外",
            "海外",
          ];

          const foundIndicators = blockIndicators.filter((indicator) =>
            content.toLowerCase().includes(indicator.toLowerCase()),
          );

          if (foundIndicators.length > 0) {
            console.log(
              `🚫 Potential blocking indicators found: ${foundIndicators.join(", ")}`,
            );
          }
        }

        // 年齢認証ページかどうかチェック
        if (title.includes("年齢認証") || page.url().includes("age_check")) {
          console.log("🔞 Age verification page detected");
        }

        // ログインページかどうかチェック
        if (title.includes("ログイン") || page.url().includes("login")) {
          console.log("🔑 Login page detected");
        }

        // ステータスコードに基づく判定
        if (status >= 200 && status < 300) {
          console.log("✅ Access successful");
        } else if (status === 403) {
          console.log("🚫 Access forbidden (403)");
        } else if (status === 451) {
          console.log(
            "🌍 Unavailable for legal reasons (451) - likely geo-blocked",
          );
        } else if (status >= 400) {
          console.log(`❌ Client error (${status})`);
        } else if (status >= 500) {
          console.log(`💥 Server error (${status})`);
        }

        // テストとしては常に成功（情報収集目的）
        expect(status).toBeGreaterThan(0);
      } catch (error) {
        console.log(
          `❌ Access failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );

        // エラーの場合もテストを続行（情報収集目的）
        expect(error).toBeDefined();
      }
    });
  });
});
