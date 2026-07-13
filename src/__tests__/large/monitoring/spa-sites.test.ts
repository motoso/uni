import { test, expect } from "@playwright/test";
import {
  spaSites,
  performHealthCheck,
  handleAgeVerification,
  waitForSPAContent,
  insertionTargets,
  isEnvironmentalIpBlock,
} from "./shared";

spaSites.forEach(
  ({
    service,
    url,
    selectors,
    hasAgeVerification,
    skipFirefox,
    isStatic,
    requiresJapanIP,
    allowIpBlock,
  }) => {
    const tag = requiresJapanIP ? "@japan" : "@global";
    test.describe(`${tag} Site Monitoring - ${service} (SPA)`, () => {
      test("should have all required selectors in Chromium", async ({
        page,
        browserName,
      }) => {
        test.skip(
          browserName !== "chromium",
          "This test only runs on Chromium",
        );

        // ヘルスチェック実行
        console.log(`🏥 Health check for ${service}...`);
        const healthCheck = await performHealthCheck(page, url);
        console.log(
          `🏥 Health check result: status=${healthCheck.httpStatus}, accessible=${healthCheck.accessible}`,
        );

        // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は構造検証不能なのでskip
        // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
        if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
          test.skip(
            true,
            `${service}: HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`,
          );
        }

        if (!healthCheck.accessible) {
          throw new Error(
            `❌ [NETWORK_ERROR] ${service} is not accessible: HTTP ${healthCheck.httpStatus} - ${healthCheck.error || "Unknown error"}`,
          );
        }

        await page.goto(url);

        if (hasAgeVerification) {
          await handleAgeVerification(page);
        }

        // SPA sites need special waiting
        await waitForSPAContent(page, selectors);

        // 各セレクタの存在確認
        for (const selector of selectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            expect(count).toBeGreaterThan(0);
          } catch (error) {
            throw new Error(
              `❌ [STRUCTURE_ERROR] ${service} - Selector not found: ${selector}`,
            );
          }
        }
      });

      test("should have all required selectors in Firefox", async ({
        page,
        browserName,
      }) => {
        test.skip(
          browserName !== "firefox" || skipFirefox,
          "This test only runs on Firefox",
        );

        // ヘルスチェック実行
        console.log(`🏥 Health check for ${service} (Firefox)...`);
        const healthCheck = await performHealthCheck(page, url);
        console.log(
          `🏥 Health check result: status=${healthCheck.httpStatus}, accessible=${healthCheck.accessible}`,
        );

        // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は構造検証不能なのでskip
        // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
        if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
          test.skip(
            true,
            `${service} (Firefox): HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`,
          );
        }

        if (!healthCheck.accessible) {
          throw new Error(
            `❌ [NETWORK_ERROR] ${service} (Firefox) is not accessible: HTTP ${healthCheck.httpStatus} - ${healthCheck.error || "Unknown error"}`,
          );
        }

        await page.goto(url);

        if (hasAgeVerification) {
          await handleAgeVerification(page);
        }

        // SPA sites need special waiting
        await waitForSPAContent(page, selectors);

        // 各セレクタの存在確認
        for (const selector of selectors) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            expect(count).toBeGreaterThan(0);
          } catch (error) {
            throw new Error(
              `❌ [STRUCTURE_ERROR] ${service} (Firefox) - Selector not found: ${selector}`,
            );
          }
        }
      });

      // ContentScript integration tests - DOM insertion verification
      test("should correctly insert extension bar in appropriate location", async ({
        page,
        browserName,
      }) => {
        // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は挿入位置検証不能なのでskip
        // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
        // allowIpBlockのサイトのみ追加のヘルスチェックを行い、それ以外は余計なHTTP往復を避ける
        if (allowIpBlock) {
          const healthCheck = await performHealthCheck(page, url);
          if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
            test.skip(
              true,
              `${service}: HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`,
            );
          }
        }

        await page.goto(url);

        if (hasAgeVerification) {
          await handleAgeVerification(page);
        }

        // SPA sites need special waiting
        await waitForSPAContent(page, selectors);

        // Check that the insertion target element exists (where ContentScript would insert the bar)
        const targetSelector = insertionTargets[service];
        if (targetSelector) {
          // Try each selector (comma-separated) until one is found
          const selectors = targetSelector.split(", ");
          let found = false;

          for (const selector of selectors) {
            try {
              const element = page.locator(selector.trim()).first();
              const count = await element.count();
              if (count > 0) {
                console.log(
                  `✓ Found insertion target for ${service}: ${selector.trim()}`,
                );
                found = true;
                break;
              }
            } catch (error) {
              // Continue to next selector
            }
          }

          if (!found) {
            throw new Error(
              `❌ [INTEGRATION_ERROR] ${service} - No suitable insertion target found among: ${targetSelector}`,
            );
          }
        }
      });
    });
  },
);
