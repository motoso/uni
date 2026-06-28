import type { FanzaVideoScrapedData } from "./types";
import { createScraperLogger } from "./utils/logger";

const logger = createScraperLogger("FANZA-Video-Scraper");

/**
 * Pure function to scrape FANZA Video data from the DOM
 * This function contains the core scraping logic without any UI dependencies
 */
export function scrapeFanzaVideoData(
  document: Document,
): FanzaVideoScrapedData | null {
  const parsePublishedAt = (value: string): Date | null => {
    const dateMatch = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (!dateMatch) return null;

    const [, year, month, day] = dateMatch;
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  };

  logger.debug("Starting FANZA Video scraping...");

  // タイトル取得 - より多くのセレクターを試行
  const titleSelectors = [
    "h1.font-semibold span", // 最優先
    "h1.font-semibold", // 次優先
    "h1[data-testid='title']", // テストID付き
    "h1", // 汎用
    ".productTitle__txt", // ページによって異なる場合
    "[data-testid='content-title']", // より具体的
    ".page-header h1", // ヘッダー内
  ];

  let titleElement: HTMLElement | null = null;
  for (const selector of titleSelectors) {
    titleElement = document.querySelector(selector) as HTMLElement;
    if (titleElement?.innerText?.trim()) {
      logger.debug(`Found title with selector: ${selector}`);
      break;
    }
    logger.debug(`Title selector failed: ${selector}`);
  }

  const title = titleElement?.innerText?.replace(/【.*】/, "").trim() || "";
  const url = document.location.href;

  if (!title) {
    logger.debug("No title found with any selector");
    return null;
  }
  logger.debug(`Title found: ${title}`);

  // より多くのセレクターでテーブルを探す
  const tableSelectors = [
    "table.text-xs.shrink", // 最優先
    "table.product-info", // 商品情報テーブル
    "table[data-testid='product-details']", // テストID付き
    ".product-details table", // 商品詳細内のテーブル
    "table", // 汎用テーブル
    ".work-outline table", // アウトライン内
    "div[role='table']", // role属性を持つdiv
  ];

  let table: HTMLTableElement | null = null;
  for (const selector of tableSelectors) {
    const element = document.querySelector(selector);
    if (
      element &&
      (element.tagName === "TABLE" || element.getAttribute("role") === "table")
    ) {
      table = element as HTMLTableElement;
      logger.debug(`Found table with selector: ${selector}`);
      break;
    }
    logger.debug(`Table selector failed: ${selector}`);
  }

  if (!table) {
    logger.debug("No product information table found");
    // テーブルが見つからない場合、ページ構造をログ出力
    const allTables = document.querySelectorAll("table");
    logger.debug(`Available tables count: ${allTables.length}`);
    allTables.forEach((t, i) => {
      logger.debug(`Table ${i}: classes="${t.className}", id="${t.id}"`);
    });
    return null;
  }
  logger.debug("Product table found");

  // テーブルから指定されたキーに対応する値を取得
  const getValueByKey = (key: string): string => {
    const rows = Array.from(table.rows);
    for (const row of rows) {
      const th = row.querySelector("th");
      const td = row.querySelector("td");
      if (th && td && th.innerText.trim().includes(key)) {
        // aタグがある場合はそのテキストを、なければtdのテキストを返す
        const link = td.querySelector("a");
        const span = td.querySelector("span");
        if (link) {
          return link.innerText.trim();
        } else if (span) {
          return span.innerText.trim();
        } else {
          return td.innerText.trim();
        }
      }
    }
    return "";
  };

  // 出演者を取得（複数の場合は配列で）
  const actressText = getValueByKey("出演者");
  const actress = actressText
    ? actressText
        .split(/[,、]/)
        .map((name) => name.trim())
        .filter((name) => name)
    : [];

  // 監督を取得
  const director = getValueByKey("監督") || null;

  // レーベルを取得
  const label = getValueByKey("レーベル");

  // 配信開始日を取得
  const publishedAtText = getValueByKey("配信開始日");
  const publishedAt = parsePublishedAt(publishedAtText);

  // 品番を取得（メーカー品番から）
  const id = getValueByKey("メーカー品番") || getValueByKey("配信品番") || "";

  return {
    title,
    url,
    actress,
    director,
    label,
    publishedAt,
    id,
  };
}
