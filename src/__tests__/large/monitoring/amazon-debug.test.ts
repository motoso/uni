import { test, expect } from "@playwright/test";
import { navigateWithStealth } from "./shared";

// CI環境でのAmazon日本語サイトのDOM構造デバッグ用テスト
// 通常は無効化しているが、専用デバッグワークフローでは実行される
const isDebugWorkflow = process.env.GITHUB_WORKFLOW === "Debug CI Environment";
const describeMethod = isDebugWorkflow ? test.describe : test.describe.skip;

describeMethod("Amazon (Japanese) DOM Structure Debug", () => {
  const amazonSite = {
    name: "Amazon (Japanese)",
    url: "https://www.amazon.co.jp/%E3%81%8A%E5%85%84%E3%81%A1%E3%82%83%E3%82%93%E3%81%AF%E3%81%8A%E3%81%97%E3%81%BE%E3%81%84-6-ID%E3%82%B3%E3%83%9F%E3%83%83%E3%82%AF%E3%82%B9-%E3%81%AD%E3%81%93%E3%81%A8%E3%81%86%E3%81%B5/dp/4758069778/?language=ja_JP",
    currentSelectors: [
      "#navbar",
      "#productTitle",
      "#detailBullets_feature_div",
      "[href*='ref=dp_byline_cont_book']",
    ],
  };

  test(`Debug DOM structure and selectors: ${amazonSite.name}`, async ({
    page,
  }) => {
    console.log(`\n🔍 Debugging ${amazonSite.name}: ${amazonSite.url}`);
    console.log(`🎭 Applying stealth mode to avoid bot detection...`);

    try {
      // ステルスモードでアクセス
      const { status } = await navigateWithStealth(page, amazonSite.url);
      const finalUrl = page.url();
      const title = await page.title();

      console.log(`\n📊 Initial Response:`);
      console.log(`   Status: ${status}`);
      console.log(`   Final URL: ${finalUrl}`);
      console.log(`   Title: ${title}`);

      // ページ全体のHTML構造を分析
      console.log(`\n📋 PAGE STRUCTURE ANALYSIS:`);

      // 1. ページの基本情報
      const htmlSnippet = await page.content();
      console.log(`   HTML Length: ${htmlSnippet.length} characters`);
      console.log(
        `   HTML Preview (first 1000 chars): ${htmlSnippet.substring(0, 1000)}...`,
      );

      // 2. 現在のセレクタのチェック
      console.log(`\n🔍 CHECKING CURRENT SELECTORS:`);
      for (const selector of amazonSite.currentSelectors) {
        try {
          const element = page.locator(selector).first();
          const count = await element.count();
          if (count > 0) {
            const visible = await element.isVisible().catch(() => false);
            const text = await element.textContent().catch(() => "");
            console.log(`   ✅ ${selector}: Found (visible: ${visible})`);
            if (text && text.length < 100) {
              console.log(`      Text: "${text.trim()}"`);
            }
          } else {
            console.log(`   ❌ ${selector}: NOT FOUND`);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.log(`   ❌ ${selector}: ERROR - ${errorMsg}`);
          if (error instanceof Error && error.stack) {
            console.log(`      Stack: ${error.stack.split("\n")[1]?.trim()}`);
          }
        }
      }

      // 3. 代替セレクタの探索
      console.log(`\n🔎 SEARCHING FOR ALTERNATIVE SELECTORS:`);

      // ナビゲーションバー関連
      const navSelectors = [
        "#navbar",
        "#nav-main",
        "header",
        '[role="navigation"]',
        ".nav-container",
        "#skiplink",
      ];

      console.log(`\n   📍 Navigation Bar Alternatives:`);
      for (const selector of navSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`      ✅ ${selector}: Found (${count} elements)`);
          }
        } catch (error) {
          // Skip
        }
      }

      // タイトル関連
      const titleSelectors = [
        "#productTitle",
        "#title",
        "h1",
        '[data-feature-name="title"]',
        ".product-title",
      ];

      console.log(`\n   📍 Title Alternatives:`);
      for (const selector of titleSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            const text = await page
              .locator(selector)
              .first()
              .textContent()
              .catch(() => "");
            console.log(
              `      ✅ ${selector}: Found (${count} elements) - "${text?.trim().substring(0, 50)}..."`,
            );
          }
        } catch (error) {
          // Skip
        }
      }

      // 商品詳細関連
      const detailSelectors = [
        "#detailBullets_feature_div",
        "#detailBulletsWrapper_feature_div",
        "#detailBullets",
        ".detail-bullets",
        "#productDetails_feature_div",
        "#productDetails_techSpec_section_1",
        "#productDetails_detailBullets_sections1",
      ];

      console.log(`\n   📍 Product Details Alternatives:`);
      for (const selector of detailSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`      ✅ ${selector}: Found (${count} elements)`);
          }
        } catch (error) {
          // Skip
        }
      }

      // 著者情報関連
      const authorSelectors = [
        "[href*='ref=dp_byline_cont_book']",
        ".author",
        ".contributorNameID",
        "[data-feature-name='bylineInfo']",
        ".a-section.a-spacing-none.author",
      ];

      console.log(`\n   📍 Author Information Alternatives:`);
      for (const selector of authorSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            const text = await page
              .locator(selector)
              .first()
              .textContent()
              .catch(() => "");
            console.log(
              `      ✅ ${selector}: Found (${count} elements) - "${text?.trim().substring(0, 50)}..."`,
            );
          }
        } catch (error) {
          // Skip
        }
      }

      // 4. ページに存在する主要なID要素をリストアップ
      console.log(`\n📑 MAJOR ID ELEMENTS ON PAGE:`);
      const idElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("[id]"));
        return elements
          .filter(
            (el) =>
              el.id && !el.id.startsWith("nav-") && !el.id.includes("carousel"),
          )
          .slice(0, 30)
          .map((el) => ({
            id: el.id,
            tagName: el.tagName,
            className: el.className,
          }));
      });

      idElements.forEach((el) => {
        console.log(
          `   #${el.id} (${el.tagName}${el.className ? ", class: " + el.className : ""})`,
        );
      });

      // 5. ボット検証やCAPTCHAの確認
      console.log(`\n🤖 CHECKING FOR BOT DETECTION:`);
      const botIndicators = [
        "Sorry, we just need to make sure",
        "Enter the characters you see",
        "CAPTCHA",
        "Robot Check",
        "ロボットでは",
      ];

      const pageText = await page.evaluate(
        () => document.body.textContent || "",
      );
      const foundIndicators = botIndicators.filter((indicator) =>
        pageText.toLowerCase().includes(indicator.toLowerCase()),
      );

      if (foundIndicators.length > 0) {
        console.log(`   ⚠️ POTENTIAL BOT DETECTION FOUND:`);
        foundIndicators.forEach((indicator) =>
          console.log(`      - ${indicator}`),
        );
      } else {
        console.log(`   ✅ No bot detection indicators found`);
      }

      // デバッグ用スクリーンショットを保存
      console.log(`\n📸 SAVING DEBUG SCREENSHOT:`);
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        await page.screenshot({
          path: `amazon-debug-screenshot-${timestamp}.png`,
          fullPage: true,
        });
        console.log(
          `   ✅ Screenshot saved: amazon-debug-screenshot-${timestamp}.png`,
        );
      } catch (error) {
        console.log(
          `   ⚠️ Failed to save screenshot: ${error instanceof Error ? error.message : "Unknown"}`,
        );
      }

      // デバッグテストは情報収集が目的なので、エラーが発生しても成功とする
      // HTTPステータスの記録のみ行い、成功/失敗は判定しない
      expect(true).toBe(true);
    } catch (error) {
      // デバッグテストは情報収集が目的なので、エラーが発生しても成功とする
      console.log(
        `❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      expect(true).toBe(true);
    }
  });
});
