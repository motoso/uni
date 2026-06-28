/**
 * Pure function to scrape FC2 Content Market data from the DOM
 */

import type { Fc2ContentMarketScrapedData } from "./types";
import { createScraperLogger } from "./utils/logger";

const logger = createScraperLogger("FC2-Content-Market-Scraper");

export function scrapeFc2ContentMarketData(
  document: Document,
): Fc2ContentMarketScrapedData | null {
  const parsePublishedAt = (value: string): Date | null => {
    if (!value) return null;

    const parsedAt = new Date(value);
    return Number.isNaN(parsedAt.getTime()) ? null : parsedAt;
  };

  try {
    const titleElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > h3",
    );
    if (!titleElement) return null;

    const title =
      titleElement.textContent?.replace(/【[^】]*】/g, "").trim() || "";

    const url = document.location?.href || "";

    const directorElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > ul > li:nth-child(3) > a",
    );
    const director = directorElement?.textContent?.trim() || "";

    const publishedAtElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > div:nth-child(5) > p",
    );
    const publishedAtStr = publishedAtElement?.textContent?.trim() || "";
    const publishedAt = parsePublishedAt(publishedAtStr);

    const idMatch = url.match(/\/article\/(\d+)\//);
    const id = idMatch ? idMatch[1] : "";

    return {
      title,
      director,
      publishedAt,
      id,
      url,
    };
  } catch (error) {
    logger.error("Error scraping FC2 Content Market data:", error);
    return null;
  }
}
