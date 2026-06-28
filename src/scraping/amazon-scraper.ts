/**
 * Pure function to scrape Amazon book data from the DOM
 */

import type { AmazonScrapedData } from "./types";
import { createScraperLogger } from "./utils/logger";

const logger = createScraperLogger("Amazon-Scraper");

export function scrapeAmazonData(document: Document): AmazonScrapedData | null {
  const debug = (message: string, ...args: unknown[]): void => {
    if (typeof logger !== "undefined") {
      logger.debug(message, ...args);
    }
  };

  const logError = (message: string, ...args: unknown[]): void => {
    if (typeof logger !== "undefined") {
      logger.error(message, ...args);
      return;
    }

    console.error("[Amazon-Scraper]", message, ...args);
  };

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
    debug("Starting Amazon scraping...");

    const titleElement = document.getElementById("productTitle");
    if (!titleElement) {
      debug("Title selector failed: #productTitle");
      return null;
    }

    const title = titleElement.textContent?.trim() || "";
    const url = document.location?.href || "";

    if (!title) {
      debug("Title element found but no text content");
      return null;
    }
    debug(`Title found: ${title.substring(0, 50)}...`);

    const productDetails = Array.from(
      document.querySelectorAll("#detailBullets_feature_div li"),
    );
    debug(
      `Found product details with selector: #detailBullets_feature_div li (${productDetails.length} items)`,
    );

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

    const authors: string[] = [];
    const authorElements = document.querySelectorAll(
      "[href*='ref=dp_byline_cont_book']",
    );
    debug(
      `Found authors with selector: [href*='ref=dp_byline_cont_book'] (${authorElements.length} elements)`,
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

    debug(`Authors found: [${authors.join(", ")}]`);

    return {
      title,
      authors,
      publisher,
      publishedAt: parsePublishedAt(publishedAtText),
      url,
    };
  } catch (error) {
    logError("Error scraping Amazon data:", error);
    return null;
  }
}
