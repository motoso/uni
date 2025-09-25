/**
 * Pure function to scrape Toranoana data from the DOM
 */

export interface ToranoanaScrapedData {
  title: string;
  authors: string[];
  circleName: string;
  genre: string[];
  mainCharacters: string[];
  eventName: string | null;
  publishedAt: string | null;
  url: string;
}

export function scrapeToranoanaData(document: Document): ToranoanaScrapedData | null {
  try {
    const titleElement = document.querySelector(".product-detail-desc-title span");
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    const circleElement = document.querySelector(".sub-circle .sub-p");
    const circleName = circleElement?.textContent?.trim() || '';

    const authorElement = document.querySelector(".sub-name .sub-p");
    const author = authorElement?.textContent?.trim() || '';

    const table = document.getElementsByClassName("product-detail-spec-table")[0];
    if (!table) return null;

    // Extract genre information
    const genreElements = (table as HTMLTableElement).rows[2]?.cells[1]?.querySelectorAll(
      ".js-product-detail-spec-genre"
    );
    const genre = genreElements
      ? Array.from(genreElements)
          .map((item) => item.textContent?.trim() || '')
          .filter((item) => !["", "入荷アラートを設定"].includes(item))
      : [];

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string): string | null => {
      const rows = Array.from((table as HTMLTableElement).rows);

      // Debug: Log all available headers for troubleshooting
      if (leftHeaderStr === "発行日") {
        console.log("Available table headers:", rows.map(row => row.cells[0]?.textContent?.trim()).filter(Boolean));
      }

      const filtered = rows.filter((row) => {
        const cellText = row.cells[0]?.textContent?.trim();
        return cellText === leftHeaderStr;
      });
      if (filtered.length > 0) {
        return filtered[0].cells[1]?.textContent?.trim() || null;
      }
      return null;
    };

    const mainCharactersStr = getElemIfExists("メインキャラ");
    const mainCharacters = mainCharactersStr ? mainCharactersStr.split(" ") : [];

    // Extract event information - remove date prefix
    const eventStr = getElemIfExists("初出イベント");
    const eventName = eventStr
      ? eventStr.replace(/^\d{4}\/\d{2}\/\d{2}/, "").trim() || null
      : null;

    // Try multiple possible keys for published date
    let publishedAtStr = getElemIfExists("発行日") || getElemIfExists("発売日") || getElemIfExists("頒布日");
    let publishedAt = null;

    if (publishedAtStr) {
      // Handle different date formats: YYYY/MM/DD or YYYY-MM-DD
      const dateMatch = publishedAtStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        publishedAt = `${year}-${month}-${day}`;
      } else {
        // If no date format is found, keep the original string
        publishedAt = publishedAtStr.trim();
      }
    }

    return {
      title,
      authors: author ? [author] : [],
      circleName,
      genre,
      mainCharacters,
      eventName,
      publishedAt,
      url,
    };
  } catch (error) {
    console.error('Error scraping Toranoana data:', error);
    return null;
  }
}