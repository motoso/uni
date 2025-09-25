import { FanzaDoujinScrapedData } from './types';

/**
 * Pure function to scrape FANZA Doujin data from the DOM
 * This function contains the core scraping logic without any UI dependencies
 */
export function scrapeFanzaDoujinData(document: Document): FanzaDoujinScrapedData | null {
  const isCI = !!(typeof process !== 'undefined' && process.env?.CI);

  // デバッグログ関数
  const log = (message: string) => {
    if (isCI) {
      console.log(`[FANZA-Doujin-Scraper] ${message}`);
    }
  };

  log('Starting FANZA Doujin scraping...');

  // タイトル取得 - より多くのセレクターを試行
  const titleSelectors = [
    ".productTitle__txt",         // 最優先
    "h1.productTitle",           // タイトルクラス付きh1
    "h1[data-testid='title']",   // テストID付き
    "h1",                        // 汎用h1
    ".title",                    // titleクラス
    ".product-title",            // 商品タイトル
    "[data-testid='product-title']", // より具体的
    ".page-header h1",           // ヘッダー内
  ];

  let titleElement: HTMLElement | null = null;
  for (const selector of titleSelectors) {
    if (selector === ".productTitle__txt") {
      titleElement = document.getElementsByClassName("productTitle__txt")[0] as HTMLElement;
    } else {
      titleElement = document.querySelector(selector) as HTMLElement;
    }

    if (titleElement?.innerText?.trim()) {
      log(`Found title with selector: ${selector}`);
      break;
    }
    log(`Title selector failed: ${selector}`);
  }

  const title = titleElement ? titleElement.innerText
    .replace(/【.*】/, "")
    .trim() : "";

  if (!title) {
    log('❌ No title found with any selector');
    return null;
  }
  log(`✅ Title found: ${title}`);

  const url = document.location.href;

  // サークル名取得 - より多くのセレクターを試行
  const circleSelectors = [
    ".circleName__txt",           // 最優先
    ".circle-name",               // 代替クラス
    ".maker a",                   // メーカー名リンク
    "[data-testid='circle-name']", // テストID付き
    ".product-maker",             // 商品メーカー
  ];

  let circleNameElement: HTMLElement | null = null;
  for (const selector of circleSelectors) {
    if (selector === ".circleName__txt") {
      circleNameElement = document.getElementsByClassName("circleName__txt")[0] as HTMLElement;
    } else {
      circleNameElement = document.querySelector(selector) as HTMLElement;
    }

    if (circleNameElement?.innerText?.trim()) {
      log(`Found circle name with selector: ${selector}`);
      break;
    }
    log(`Circle selector failed: ${selector}`);
  }

  const circleName = circleNameElement?.innerText?.trim() || "";
  if (circleName) {
    log(`✅ Circle name found: ${circleName}`);
  } else {
    log('⚠️ No circle name found');
  }

  // 作者名の取得：「作者」項目を探す
  let authors = [];
  const informationItems = document.getElementsByClassName("productInformation__item");
  for (let i = 0; i < informationItems.length; i++) {
    const item = informationItems[i];
    const titleElement = item.querySelector(".informationList__ttl") as HTMLElement;
    if (titleElement && titleElement.innerText.trim() === "作者") {
      const txtElement = item.querySelector(".informationList__txt") as HTMLElement;
      if (txtElement) {
        const authorName = txtElement.innerText.trim();
        if (authorName) {
          authors.push(authorName);
        }
        break;
      }
    }
  }

  // 配信開始日の取得
  let publishedAt = null;
  const productInfoElements = document.getElementsByClassName("productInformation__item");
  for (let i = 0; i < productInfoElements.length; i++) {
    const item = productInfoElements[i];
    const titleElement = item.querySelector(".informationList__ttl") as HTMLElement;
    if (titleElement && titleElement.innerText.trim() === "配信開始日") {
      const txtElement = item.querySelector(".informationList__txt") as HTMLElement;
      if (txtElement) {
        const dateText = txtElement.innerText;
        const dateMatch = dateText.match(/(\d{4})\/(\d{2})\/(\d{2})/);
        if (dateMatch) {
          publishedAt = new Date(dateMatch.slice(1).join("-"));
        }
        break;
      }
    }
  }

  return {
    title,
    url,
    circleName,
    authors,
    publishedAt,
  };
}