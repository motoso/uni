import { Page } from '@playwright/test';

export interface SiteConfig {
  service: string;
  url: string;
  selectors: string[];
  hasAgeVerification?: boolean;
  skipFirefox?: boolean;
  isStatic?: boolean;
  requiresJapanIP?: boolean;
}

// ヘルスチェック関数 - ネットワーク問題か構造問題かを判別
export async function performHealthCheck(page: Page, url: string): Promise<{
  httpStatus: number | null;
  accessible: boolean;
  error?: string;
}> {
  try {
    const response = await page.goto(url, { waitUntil: 'commit' });
    const status = response?.status() ?? null;

    return {
      httpStatus: status,
      accessible: status ? status < 400 : false
    };
  } catch (error) {
    return {
      httpStatus: null,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 年齢認証処理のヘルパー関数
export async function handleAgeVerification(page: Page): Promise<void> {
  const isCI = !!process.env.CI;
  const initialTimeout = isCI ? 15000 : 5000;
  const redirectTimeout = isCI ? 30000 : 10000;

  try {
    console.log(`[${isCI ? 'CI' : 'LOCAL'}] Checking for age verification...`);

    // 現在のURLを確認して年齢認証ページかどうか判定
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('age_check') || currentUrl.includes('年齢認証')) {
      console.log('🔞 Age verification page detected');

      // 年齢認証ボタンを試行 (supports both English for CI and Japanese for local VPN)
      const ageCheckSelectors = [
        // English prompts (GitHub Actions runs from the US and surfaces these)
        'text=Agree',
        'text=I Agree',
        'text=Yes',
        'button:has-text("Agree")',
        'button:has-text("I Agree")',
        'button:has-text("Yes")',
        'a:has-text("Agree")',
        'a:has-text("I Agree")',
        'a:has-text("Yes")',
        // Japanese prompts (local debugging from Japan VPN keeps working)
        'text=はい',
        'button:has-text("はい")',
        'input[value="はい"]',
        'a:has-text("はい")'
      ];

      let buttonClicked = false;
      for (const selector of ageCheckSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            console.log(`✅ Found age verification button: ${selector}`);
            await button.click();
            buttonClicked = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
          console.log(`❌ Button not found: ${selector}`);
        }
      }

      if (!buttonClicked) {
        console.log('❌ No age verification button found, checking for auto-redirect...');
        // CI環境では自動リダイレクトがある場合を考慮してしばらく待機
        if (isCI) {
          await page.waitForTimeout(5000);
        }
      } else {
        console.log('✅ Age verification button clicked');

        // CI環境ではクリック後に少し待機
        if (isCI) {
          await page.waitForTimeout(3000);
        }
      }

      // リダイレクト完了まで待機（複数パターン対応）
      try {
        await Promise.race([
          page.waitForURL('**/av/content/**', { timeout: redirectTimeout }),
          page.waitForURL('**/dc/doujin/**', { timeout: redirectTimeout }),
          page.waitForURL('**/book/**', { timeout: redirectTimeout }),
          page.waitForURL('**/anime/content/**', { timeout: redirectTimeout }),
          page.waitForURL(url => !url.href.includes('age_check') && !url.href.includes('login'), { timeout: redirectTimeout })
        ]);
        console.log('✅ Age verification completed, redirected to content page');
      } catch (error) {
        // リダイレクトが失敗した場合、現在のURLを再確認
        const finalUrl = page.url();
        console.log(`Final URL after age verification: ${finalUrl}`);

        if (finalUrl.includes('age_check') || finalUrl.includes('login')) {
          throw new Error(`Age verification failed - still on auth page: ${finalUrl}`);
        } else if (finalUrl.includes('dmm.co.jp')) {
          // Age verification success - only log on verbose mode
          if (process.env.VERBOSE_DEBUG) {
            console.log('✅ Successfully bypassed age verification');
          }
        } else {
          throw error;
        }
      }

      // CI環境ではリダイレクト後にコンテンツ読み込み完了まで十分待機
      if (isCI) {
        if (process.env.VERBOSE_DEBUG) {
          console.log('CI: Adding post-redirect content loading time (10s)...');
        }
        await page.waitForTimeout(10000);
        // さらにネットワークアイドルも待機
        try {
          await page.waitForLoadState('networkidle', { timeout: 8000 });
          if (process.env.VERBOSE_DEBUG) {
        console.log('CI: Network idle achieved');
      }
        } catch (error) {
          console.log('CI: Network idle timeout, proceeding anyway');
        }
      }
    } else {
      console.log('ℹ️ No age verification page detected or already bypassed');
    }
  } catch (error) {
    console.log('⚠️ Age verification handling failed:', error instanceof Error ? error.message : 'Unknown error');
    // CI環境では年齢認証失敗時にスクリーンショットを撮影
    if (isCI) {
      const screenshotPath = `debug-age-verification-failed-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Age verification failure screenshot: ${screenshotPath}`);
    }
    throw error; // Re-throw to fail the test
  }
}

// ステルスモード設定の定数
const STEALTH_RANDOM_DELAY_MIN = 500;  // ランダム待機の最小値（ms）
const STEALTH_RANDOM_DELAY_MAX = 1500; // ランダム待機の最大値（ms）
const STEALTH_STABILIZATION_DELAY = 2000; // 安定化待機時間（ms）

// ステルスモード設定 - ボット検出回避
export async function setupStealthMode(page: Page): Promise<void> {
  // JavaScript API偽装でHeadless検出を回避
  await page.addInitScript(() => {
    // navigator.webdriver を削除
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Chrome runtime を追加（Headlessブラウザでは通常存在しない）
    (window as any).chrome = {
      runtime: {},
    };

    // Permissions API の偽装
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = ((parameters: PermissionDescriptor) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: 'denied', onchange: null } as PermissionStatus) :
        originalQuery.call(window.navigator.permissions, parameters)
    )) as typeof originalQuery;
  });

  // 人間らしい動作パターン - ランダムな待機
  const randomDelay = Math.random() * (STEALTH_RANDOM_DELAY_MAX - STEALTH_RANDOM_DELAY_MIN) + STEALTH_RANDOM_DELAY_MIN;
  await page.waitForTimeout(randomDelay);
}

// Amazon専用のナビゲーション - ステルス設定込み
export async function navigateToAmazonWithStealth(page: Page, url: string): Promise<{ status: number }> {
  // ステルスモードを設定
  await setupStealthMode(page);

  // ページに移動（早期に解析開始）
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  const status = response?.status() || 0;

  // 段階的な読み込み待機
  await page.waitForLoadState('load');

  // 人間らしいマウス移動のシミュレーション
  try {
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
  } catch (error) {
    // マウス操作失敗は無視
  }

  // 軽いスクロール動作
  try {
    await page.evaluate(() => {
      window.scrollBy(0, 100);
    });
  } catch (error) {
    // スクロール失敗は無視
  }

  // 追加の安定化待機
  await page.waitForTimeout(STEALTH_STABILIZATION_DELAY);

  return { status };
}

// Static sites読み込み完了の待機 - 動的DOM生成対応
export async function waitForStaticContent(page: Page, selectors: string[]): Promise<void> {
  if (selectors.length === 0) return;

  for (const selector of selectors) {
    // まず高速チェック - 既に存在するか確認
    const quickCheck = await page.locator(selector).count().catch(() => 0);
    if (quickCheck > 0) {
      continue;
    }

    // 一部のstatic sites (例: Amazon) は動的にDOM要素を生成する
    // ページロード後もJavaScriptで要素を追加する場合があるため待機
    await page.waitForSelector(selector, {
      timeout: 10000,
      state: 'attached'
    });
  }
}

// SPA読み込み完了の待機 - CI環境での年齢認証バイパス対応
export async function waitForSPAContent(page: Page, selectors: string[]): Promise<void> {
  if (selectors.length === 0) return;

  const isCI = !!process.env.CI;
  if (process.env.VERBOSE_DEBUG) {
    console.log(`[${isCI ? 'CI' : 'LOCAL'}] Starting SPA content detection for selectors: [${selectors.join(', ')}]`);
  }

  // CI環境では年齢認証がバイパスされるため、SPA初期化を確実に待つ
  if (isCI) {
    if (process.env.VERBOSE_DEBUG) {
      console.log('CI: Ensuring SPA initialization completion...');
    }

    // 1. ネットワークアイドルを待機してリソース読み込み完了を確認
    try {
      await page.waitForLoadState('networkidle', { timeout: 12000 });
      if (process.env.VERBOSE_DEBUG) {
        console.log('CI: Network idle achieved');
      }
    } catch (error) {
      if (process.env.VERBOSE_DEBUG) {
        console.log('CI: Network idle timeout, proceeding with DOM ready check');
      }
    }

    // 2. DOM readyStateの確認
    try {
      await page.waitForFunction('document.readyState === "complete"', { timeout: 8000 });
      if (process.env.VERBOSE_DEBUG) {
        console.log('CI: Document ready state complete');
      }
    } catch (error) {
      if (process.env.VERBOSE_DEBUG) {
        console.log('CI: Document ready timeout, proceeding anyway');
      }
    }

    // 3. 一般的なSPA初期化完了の待機（React/Vue等のレンダリング）
    await page.waitForTimeout(3000);
    if (process.env.VERBOSE_DEBUG) {
      console.log('CI: Post-navigation SPA initialization wait complete');
    }
  }

  // Try each selector in order, prioritizing specific content selectors
  const prioritizedSelectors = selectors.filter(s => s !== 'body' && s !== 'html')
    .concat(selectors.filter(s => s === 'body' || s === 'html'));

  const timeout = isCI ? 15000 : 8000; // CI: 単一の長いタイムアウト、ローカル: 短めで効率的に
  console.log(`[${isCI ? 'CI' : 'LOCAL'}] Attempting content detection (timeout: ${timeout}ms)`);

  for (const selector of prioritizedSelectors) {
    try {
      // 要素の存在確認
      const element = await page.waitForSelector(selector, { timeout });

      // CI環境では要素が見つかっても実際にコンテンツが入っているか確認
      if (isCI) {
        const hasContent = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;

          // テキストコンテンツまたは子要素があるかチェック
          const hasText = el.textContent && el.textContent.trim().length > 0;
          const hasChildren = el.children && el.children.length > 0;

          return hasText || hasChildren;
        }, selector);

        if (!hasContent) {
          console.log(`❌ Selector '${selector}' found but has no content, trying next...`);
          continue;
        }
      }

      console.log(`✅ SPA content loaded and verified, found selector: ${selector}`);

      // CI環境では最終的な描画完了のための短い待機
      if (isCI) {
        await page.waitForTimeout(1000);
      }

      return; // Success!
    } catch (error) {
      console.log(`❌ Selector '${selector}' not found within ${timeout}ms`);
      // Continue to next selector
    }
  }

  // All attempts failed - take screenshot and debug DOM structure
  console.log(`All SPA content detection failed for selectors: [${selectors.join(', ')}]`);

  if (isCI) {
    // CI環境でDOMデバッグ情報を出力
    console.log('🔍 DEBUG: Analyzing current DOM structure...');
    console.log('🏗️ Environment Info:');
    console.log(`   CI: ${process.env.CI}`);
    console.log(`   GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS}`);
    console.log(`   NODE_VERSION: ${process.version}`);
    console.log(`   USER_AGENT: ${await page.evaluate(() => navigator.userAgent)}`);
    console.log(`   VIEWPORT: ${await page.evaluate(() => `${window.innerWidth}x${window.innerHeight}`)}`);
    console.log(`   IS_HEADLESS: ${await page.evaluate(() => navigator.webdriver)}`);

    const browserInfo = await page.evaluate(() => ({
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      webdriver: navigator.webdriver
    }));
    console.log(`   BROWSER_INFO: ${JSON.stringify(browserInfo)}`);

    const domInfo = await page.evaluate(() => {
      const info = {
        title: document.title || 'No title',
        url: window.location.href,
        bodyChildrenCount: document.body?.children?.length || 0,
        headChildrenCount: document.head?.children?.length || 0,
        allH1Elements: Array.from(document.querySelectorAll('h1')).map(el => ({
          tagName: el.tagName,
          textContent: el.textContent?.slice(0, 100) || '',
          className: el.className || '',
          id: el.id || ''
        })),
        allTableElements: Array.from(document.querySelectorAll('table')).length,
        bodyClasses: document.body?.className || '',
        commonSelectors: [
          '.productTitle__txt',
          '.css-1omcat5',
          'dl',
          'h1',
          'table'
        ].map(sel => ({
          selector: sel,
          found: document.querySelector(sel) !== null,
          count: document.querySelectorAll(sel).length,
          firstElementInfo: (() => {
            const el = document.querySelector(sel);
            if (!el) return null;
            return {
              tagName: el.tagName,
              textContent: el.textContent?.slice(0, 100) || '',
              className: el.className || '',
              id: el.id || ''
            };
          })()
        }))
      };
      return info;
    });

    console.log('📊 DOM DEBUG INFO:');
    console.log(`   Title: ${domInfo.title}`);
    console.log(`   URL: ${domInfo.url}`);
    console.log(`   Body children: ${domInfo.bodyChildrenCount}`);
    console.log(`   Head children: ${domInfo.headChildrenCount}`);
    console.log(`   Body classes: ${domInfo.bodyClasses}`);
    console.log(`   H1 elements found: ${domInfo.allH1Elements.length}`);

    domInfo.allH1Elements.forEach((h1, idx) => {
      console.log(`   H1[${idx}]: "${h1.textContent}" (class: "${h1.className}", id: "${h1.id}")`);
    });

    console.log(`   Table elements: ${domInfo.allTableElements}`);
    console.log('🎯 SELECTOR ANALYSIS:');

    domInfo.commonSelectors.forEach(selectorInfo => {
      console.log(`   ${selectorInfo.selector}: ${selectorInfo.found ? '✅ FOUND' : '❌ NOT FOUND'} (count: ${selectorInfo.count})`);
      if (selectorInfo.firstElementInfo) {
        const info = selectorInfo.firstElementInfo;
        console.log(`      → "${info.textContent}" (class: "${info.className}", id: "${info.id}")`);
      }
    });
  }

  const screenshotPath = `debug-spa-content-failed-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Debug screenshot saved: ${screenshotPath}`);

  throw new Error(`SPA content not found or empty for selectors: [${selectors.join(', ')}]`);
}

// Static sites (formerly in monitoring.test.ts)
export const staticSites: SiteConfig[] = [
  {
    service: "BookWalker",
    url: "https://bookwalker.jp/defb2e0181-c515-4443-9039-11b07c68a30b/",
    selectors: [
      ".c-c-header", // header
      ".t-c-product-main-data__title", // title
      ".t-c-detail-about-information__data dd:nth-of-type(3)", // label
      ".t-c-detail-about-information__data dd:nth-of-type(4)", // publisher
      ".t-c-product-main-data__authors", // author
      ".t-c-detail-about-information__data dd:nth-of-type(6)", // publishedAt
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: false,
  },
  // Amazon (Japanese) は除外
  // 理由: Amazonの高度なボット検出システムにより、CI環境・VPN環境いずれでもCAPTCHAが表示され回避不可能
  // 詳細: docs/amazon-vpn-test-investigation.md 参照
  {
    service: "DLsite",
    url: "https://www.dlsite.com/maniax/work/=/product_id/RJ01341329.html",
    selectors: [
      "#header", // header where bar is inserted
      "#work_name", // title
      "#work_maker", // maker/circle table
      "#work_outline", // product details outline table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: true,
    hasAgeVerification: true,
  },
  {
    service: "DLsiteBooks",
    url: "https://www.dlsite.com/books/work/=/product_id/BJ02112599.html",
    selectors: [
      "#header", // header where bar is inserted
      "#work_name", // title
      "#work_maker", // maker/circle table
      "#work_outline", // product details outline table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: true,
    hasAgeVerification: true,
  },
  {
    service: "Melonbooks",
    url: "https://www.melonbooks.co.jp/detail/detail.php?product_id=3193504",
    selectors: [
      "#header_free_html", // header where bar is inserted
      "#contents > div.item-page > div.item-header > h1", // title
      "#contents > div.item-page table > tbody", // product info table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: false,
  },
  {
    service: "DLsiteManiax",
    url: "https://www.dlsite.com/maniax/work/=/product_id/RJ01341329.html", // Same as DLsite for now
    selectors: [
      "#header", // header where bar is inserted
      "#work_name", // title
      "#work_maker", // maker/circle table
      "#work_outline", // product details outline table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: true,
    hasAgeVerification: true,
  },
  {
    service: "Fc2ContentMarket",
    url: "https://adult.contents.fc2.com/article/4762382/",
    selectors: [
      "header", // header where bar is inserted
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > h3", // title
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > ul > li:nth-child(3) > a", // director
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: true, // Geographic restriction: returns "product not found" from non-Japan IPs
  },
  {
    service: "Surugaya",
    url: "https://www.suruga-ya.jp/product/detail/ZHORE232364",
    selectors: [
      "body > div.dialog-off-canvas-main-canvas > header > div.top_nav", // header where bar is inserted
      "#item_title", // title
      "#item_detailInfo > div:nth-child(1) > table", // product info table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: true, // Cloudflare blocks non-Japan IPs with HTTP 403
  },
  {
    service: "Toranoana",
    url: "https://ec.toranoana.jp/tora_r/ec/item/040031259959/",
    selectors: [
      "header", // header where bar is inserted
      ".product-detail-desc-title span", // title
      ".sub-circle .sub-p", // circle name
      ".sub-name .sub-p", // author
      ".product-detail-spec-table", // product info table
    ],
    isStatic: true,
    skipFirefox: false,
    requiresJapanIP: false,
  },
];

// SPA sites (existing)
export const spaSites: SiteConfig[] = [
  {
    service: "FANZA Video",
    url: "https://video.dmm.co.jp/av/content/?id=apns00240",
    selectors: [
      "h1", // Japanese content requires specific title selector
      // Removed generic fallbacks - VPN ensures Japanese content consistency
    ],
    hasAgeVerification: true,
    skipFirefox: false, // FirefoxでもテストしてChrome/Firefox差異を検出
    requiresJapanIP: true,
  },
  {
    service: "FANZA Doujin",
    url: "https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=d_335698/",
    selectors: [
      ".productTitle__txt", // Specific Japanese content selector only
      // Removed generic fallbacks - VPN ensures Japanese content consistency
    ],
    hasAgeVerification: true,
    skipFirefox: false,
    requiresJapanIP: true,
  },
  {
    service: "FANZA Books",
    url: "https://book.dmm.co.jp/product/4425627/b425aakkg00576/",
    selectors: [
      "h1", // Title element (site migrated from Emotion to styled-components)
      // Removed generic fallbacks - VPN ensures Japanese content consistency
    ],
    hasAgeVerification: true, // book.dmm.co.jp now requires age verification
    skipFirefox: false,
    requiresJapanIP: true,
  },
  {
    service: "FANZA Anime",
    url: "https://video.dmm.co.jp/anime/content/?id=196glod00333",
    selectors: [
      "h1", // Japanese content requires specific title selector
      // Removed generic fallbacks - VPN ensures Japanese content consistency
    ],
    hasAgeVerification: true,
    skipFirefox: false,
    requiresJapanIP: true,
  },
];

// ContentScript insertion target mapping
export const insertionTargets = {
  'BookWalker': '.c-c-header',
  'Amazon (English)': '#navbar',
  // 'Amazon (Japanese)': テスト対象から除外（ボット検出回避不可能）
  'DLsite': '#header',
  'DLsiteBooks': '#header',
  'Melonbooks': '#header_free_html',
  'DLsiteManiax': '#header',
  'Fc2ContentMarket': 'header',
  'Surugaya': 'body > div.dialog-off-canvas-main-canvas > header > div.top_nav',
  'Toranoana': 'header',
  'FANZA Video': 'header, body', // Fallback to body if header not found
  'FANZA Doujin': 'header, body',
  'FANZA Books': 'header, body',
  'FANZA Anime': 'header, body'
};
