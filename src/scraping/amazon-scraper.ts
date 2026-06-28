/**
 * Pure function to scrape Amazon book data from the DOM
 */

import type { AmazonScrapedData } from "./types";
import { createScraperLogger } from "./utils/logger";

const logger = createScraperLogger("Amazon-Scraper");

export function scrapeAmazonData(document: Document): AmazonScrapedData | null {
  const parsePublishedAt = (value: string | null): Date | null => {
    if (!value) return null;

    const dateMatch = value.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      );
    }

    const parsedAt = new Date(value.trim());
    return Number.isNaN(parsedAt.getTime()) ? null : parsedAt;
  };

  const getDetailValue = (
    row: Element | null,
    labels: readonly string[],
  ): string | null => {
    if (!row?.textContent) return null;

    const normalizedText = row.textContent
      .replace(/[\u200e\u200f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    for (const label of labels) {
      const match = normalizedText.match(
        new RegExp(`${label}\\s*:\\s*(.+)$`, "i"),
      );
      if (match) {
        return match[1]
          .replace(/\s*\|.*$/, "")
          .replace(/\s*\(.*$/, "")
          .trim();
      }
    }

    return null;
  };

  try {
    logger.debug("Starting Amazon scraping...");

    // タイトル取得 - より多くのセレクターを試行
    const titleSelectors = [
      "#productTitle", // 最優先
      "#title", // 代替ID
      "h1.product-title", // クラス付きh1
      "h1 span#productTitle", // ネストしたspan
      "[data-testid='product-title']", // テストID
      ".product-title", // クラス
      "h1", // 汎用h1
    ];

    let titleElement: HTMLElement | null = null;
    for (const selector of titleSelectors) {
      if (selector === "#productTitle") {
        titleElement = document.getElementById("productTitle");
      } else {
        titleElement = document.querySelector(selector) as HTMLElement;
      }

      if (titleElement?.textContent?.trim()) {
        logger.debug(`Found title with selector: ${selector}`);
        break;
      }
      logger.debug(`Title selector failed: ${selector}`);
    }

    if (!titleElement) {
      logger.debug("No title found with any selector");
      return null;
    }

    const title = titleElement.textContent?.trim() || "";
    const url = document.location?.href || "";

    if (!title) {
      logger.debug("Title element found but no text content");
      return null;
    }
    logger.debug(`Title found: ${title.substring(0, 50)}...`);

    // Get product details - より多くのセレクターを試行
    const detailsSelectors = [
      "#detailBullets_feature_div li", // 最優先
      "#feature-bullets li", // 代替セレクター
      "#productDetails_feature_div li", // 商品詳細
      ".feature li", // フィーチャーリスト
      "[data-testid='product-details'] li", // テストID付き
      ".product-details li", // クラス
      "#productDetails li", // 商品詳細リスト
    ];

    let productDetails: Element[] = [];
    for (const selector of detailsSelectors) {
      productDetails = Array.from(document.querySelectorAll(selector));
      if (productDetails.length > 0) {
        logger.debug(
          `Found product details with selector: ${selector} (${productDetails.length} items)`,
        );
        break;
      }
      logger.debug(`Product details selector failed: ${selector}`);
    }

    if (productDetails.length === 0) {
      logger.debug("No product details found, trying table-based approach");
      // テーブルベースのアプローチを試行
      const tableRows = Array.from(
        document.querySelectorAll("#productDetails_detailBullets_sections1 tr"),
      );
      if (tableRows.length > 0) {
        productDetails = tableRows;
        logger.debug(
          `Found product details in table format (${tableRows.length} rows)`,
        );
      }
    }

    // Extract publisher from product details (Japanese and English support)
    const publisherRows = productDetails.filter((i) => {
      const text = (i as HTMLElement).textContent || "";
      return text.includes("出版社") || text.includes("Publisher");
    });
    const publisherRow =
      publisherRows.length > 0 ? (publisherRows[0] as HTMLElement) : null;

    const publisher = getDetailValue(publisherRow, ["出版社", "Publisher"]);

    // Extract publication date (Japanese and English support)
    let publishedAtText = null;
    const publishedAtRows = productDetails.filter((i) => {
      const text = (i as HTMLElement).textContent || "";
      return text.includes("発売日") || text.includes("Publication date");
    });
    if (publishedAtRows.length > 0) {
      const publishedAtRow = publishedAtRows[0] as HTMLElement;
      publishedAtText = getDetailValue(publishedAtRow, [
        "発売日",
        "Publication date",
      ]);
    }

    // Extract authors - より多くのセレクターを試行
    const authors: string[] = [];
    const authorSelectors = [
      "[href*='ref=dp_byline_cont_book']", // 最優先（byline links）
      ".author a", // author クラス内のリンク
      "#bylineInfo a", // byline 情報内のリンク
      ".a-color-secondary a", // セカンダリカラーのリンク（著者によく使われる）
      "[data-testid='author-link']", // テストID付き
      ".author-name", // 著者名クラス
      ".by-author a", // by-authorクラス内
    ];

    for (const selector of authorSelectors) {
      const authorElements = document.querySelectorAll(selector);
      if (authorElements.length > 0) {
        logger.debug(
          `Found authors with selector: ${selector} (${authorElements.length} elements)`,
        );
        for (const authorElement of authorElements) {
          const authorName = authorElement.textContent?.trim();
          if (
            authorName &&
            !authors.includes(authorName) &&
            authorName.length > 1
          ) {
            authors.push(authorName);
          }
        }
        if (authors.length > 0) break; // 著者が見つかったら他のセレクターは試さない
      }
      logger.debug(`Author selector failed: ${selector}`);
    }

    logger.debug(`Authors found: [${authors.join(", ")}]`);

    return {
      title,
      authors,
      publisher,
      publishedAt: parsePublishedAt(publishedAtText),
      url,
    };
  } catch (error) {
    logger.error("Error scraping Amazon data:", error);
    return null;
  }
}
