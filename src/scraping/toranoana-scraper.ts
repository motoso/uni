/**
 * Pure function to scrape Toranoana data from the DOM
 */

import type { ToranoanaScrapedData } from "./types";
import { createScraperLogger } from "./utils/logger";

const logger = createScraperLogger("Toranoana-Scraper");

export function scrapeToranoanaData(
  document: Document,
): ToranoanaScrapedData | null {
  const parsePublishedAt = (value: string | null): Date | null => {
    const dateMatch = value?.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!dateMatch) return null;

    const [, year, month, day] = dateMatch;
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  };

  try {
    const titleElement = document.querySelector(
      ".product-detail-desc-title span",
    );
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || "";
    const url = document.location?.href || "";

    const table = document.getElementsByClassName(
      "product-detail-spec-table",
    )[0];
    if (!table) return null;

    const rows = Array.from((table as HTMLTableElement).rows);
    const getValueCell = (leftHeaderStr: string): HTMLTableCellElement | null => {
      const normalizedHeader = leftHeaderStr.replace(/\s+/g, "");
      const row = rows.find(
        (candidate) =>
          candidate.cells[0]?.textContent?.replace(/\s+/g, "") ===
          normalizedHeader,
      );
      return row?.cells[1] || null;
    };

    const circleElement = getValueCell("サークル名")?.querySelector("a[title]");
    const circleName = circleElement?.textContent?.trim() || "";

    const authors = Array.from(
      getValueCell("作家")?.querySelectorAll('a[name="spec-actor"]') || [],
    )
      .map((element) => element.textContent?.trim() || "")
      .filter(Boolean);

    const genreElements = getValueCell(
      "ジャンル/サブジャンル",
    )?.querySelectorAll(".js-product-detail-spec-genre");
    const genre = genreElements
      ? Array.from(genreElements)
          .map((item) => item.textContent?.trim() || "")
          .filter((item) => !["", "入荷アラートを設定"].includes(item))
      : [];

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string): string | null => {
      // Debug: Log all available headers for troubleshooting
      if (leftHeaderStr === "発行日") {
        logger.debug(
          "Available table headers:",
          rows.map((row) => row.cells[0]?.textContent?.trim()).filter(Boolean),
        );
      }

      return getValueCell(leftHeaderStr)?.textContent?.trim() || null;
    };

    const mainCharactersStr = getElemIfExists("メインキャラ");
    const mainCharacters = mainCharactersStr
      ? mainCharactersStr.split(" ")
      : [];

    // Extract event information - remove date prefix
    const eventStr = getElemIfExists("初出イベント");
    const eventName = eventStr
      ? eventStr.replace(/^\d{4}\/\d{2}\/\d{2}/, "").trim() || null
      : null;

    // Try multiple possible keys for published date
    const publishedAt = parsePublishedAt(
      getElemIfExists("発行日") ||
        getElemIfExists("発売日") ||
        getElemIfExists("頒布日"),
    );

    return {
      title,
      authors,
      circleName,
      genre,
      mainCharacters,
      eventName,
      publishedAt,
      url,
    };
  } catch (error) {
    logger.error("Error scraping Toranoana data:", error);
    return null;
  }
}
