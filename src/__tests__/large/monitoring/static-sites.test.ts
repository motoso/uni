import { test, expect } from '@playwright/test';
import {
  staticSites,
  performHealthCheck,
  handleAgeVerification,
  waitForSPAContent,
  waitForStaticContent,
  insertionTargets,
  isEnvironmentalIpBlock
} from './shared';

staticSites.forEach(({ service, url, selectors, hasAgeVerification, skipFirefox, isStatic, requiresJapanIP, allowIpBlock }) => {
  const tag = requiresJapanIP ? '@japan' : '@global';
  test.describe(`${tag} Site Monitoring - ${service} (Static)`, () => {

    test('should have all required selectors in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'This test only runs on Chromium');

      // ヘルスチェック実行
      console.log(`🏥 Health check for ${service}...`);
      const healthCheck = await performHealthCheck(page, url);
      console.log(`🏥 Health check result: status=${healthCheck.httpStatus}, accessible=${healthCheck.accessible}`);

      // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は構造検証不能なのでskip
      // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
      if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
        test.skip(true, `${service}: HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`);
      }

      if (!healthCheck.accessible) {
        throw new Error(`❌ [NETWORK_ERROR] ${service} is not accessible: HTTP ${healthCheck.httpStatus} - ${healthCheck.error || 'Unknown error'}`);
      }

      await page.goto(url);

      if (hasAgeVerification) {
        await handleAgeVerification(page);
      }

      // Static sites can proceed immediately after load
      await page.waitForLoadState('load');

      // 動的DOM生成を考慮した待機 (一部のサイトはページロード後もJSで要素を生成する)
      await waitForStaticContent(page, selectors);

      // 各セレクタの存在確認
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          const count = await element.count();
          expect(count).toBeGreaterThan(0);
        } catch (error) {
          throw new Error(`❌ [STRUCTURE_ERROR] ${service} - Selector not found: ${selector}`);
        }
      }
    });

    test('should have all required selectors in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox' || skipFirefox, 'This test only runs on Firefox');

      // ヘルスチェック実行
      console.log(`🏥 Health check for ${service} (Firefox)...`);
      const healthCheck = await performHealthCheck(page, url);
      console.log(`🏥 Health check result: status=${healthCheck.httpStatus}, accessible=${healthCheck.accessible}`);

      // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は構造検証不能なのでskip
      // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
      if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
        test.skip(true, `${service} (Firefox): HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`);
      }

      if (!healthCheck.accessible) {
        throw new Error(`❌ [NETWORK_ERROR] ${service} (Firefox) is not accessible: HTTP ${healthCheck.httpStatus} - ${healthCheck.error || 'Unknown error'}`);
      }

      await page.goto(url);

      if (hasAgeVerification) {
        await handleAgeVerification(page);
      }

      // Static sites can proceed immediately after load
      await page.waitForLoadState('load');

      // 動的DOM生成を考慮した待機 (一部のサイトはページロード後もJSで要素を生成する)
      await waitForStaticContent(page, selectors);

      // 各セレクタの存在確認
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          const count = await element.count();
          expect(count).toBeGreaterThan(0);
        } catch (error) {
          throw new Error(`❌ [STRUCTURE_ERROR] ${service} (Firefox) - Selector not found: ${selector}`);
        }
      }
    });

    // ContentScript integration tests - DOM insertion verification
    test('should correctly insert extension bar in appropriate location', async ({ page, browserName }) => {
      // CIのVPNデータセンターIPがCloudflareに403でブロックされた場合は挿入位置検証不能なのでskip
      // (環境要因。詳細: docs/monitoring-ip-block-limitation.md)
      const healthCheck = await performHealthCheck(page, url);
      if (isEnvironmentalIpBlock(healthCheck, allowIpBlock)) {
        test.skip(true, `${service}: HTTP 403 — Cloudflare datacenter-IP block (environmental, not a structure change). See docs/monitoring-ip-block-limitation.md`);
      }

      await page.goto(url);

      if (hasAgeVerification) {
        await handleAgeVerification(page);
      }

      // Static sites - wait for load
      await page.waitForLoadState('load');

      // Check that the insertion target element exists (where ContentScript would insert the bar)
      const targetSelector = insertionTargets[service];
      if (targetSelector) {
        // Try each selector (comma-separated) until one is found
        const selectors = targetSelector.split(', ');
        let found = false;

        for (const selector of selectors) {
          try {
            const trimmedSelector = selector.trim();

            // 高速チェック - 既に存在するか確認
            const quickCheck = await page.locator(trimmedSelector).first().count().catch(() => 0);
            if (quickCheck > 0) {
              console.log(`✓ Found insertion target for ${service}: ${trimmedSelector}`);
              found = true;
              break;
            }

            // 動的に生成される可能性のある要素を待機 (例: Amazon #navbar)
            await page.waitForSelector(trimmedSelector, { timeout: 10000, state: 'attached' });
            const element = page.locator(trimmedSelector).first();
            const count = await element.count();
            if (count > 0) {
              console.log(`✓ Found insertion target for ${service}: ${trimmedSelector}`);
              found = true;
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!found) {
          throw new Error(`❌ [INTEGRATION_ERROR] ${service} - No suitable insertion target found among: ${targetSelector}`);
        }
      }
    });
  });
});