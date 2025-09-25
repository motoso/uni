/**
 * Pure function to scrape Melonbooks data from the DOM
 */

export interface MelonbooksScrapedData {
  title: string;
  authors: string[];
  circleName: string;
  genre: string[];
  eventName: string | null;
  publishedAt: string | null;
  url: string;
}

export function scrapeMelonbooksData(document: Document): MelonbooksScrapedData | null {
  try {
    const titleElement = document.querySelector(
      "#contents > div.item-page > div.item-header > h1"
    );
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    const table = document.querySelector(
      "#contents > div.item-page table > tbody"
    );
    if (!table) return null;

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string): string | null => {
      const rows = Array.from((table as HTMLTableElement).rows);
      const filtered = rows.filter(
        (row) => row.cells[0]?.textContent === leftHeaderStr,
      );
      if (filtered.length > 0) {
        return filtered[0].cells[1]?.textContent || null;
      }
      return null;
    };

    const circleNameRaw = getElemIfExists("サークル名");
    const circleName = circleNameRaw?.replace(/\(作品数:\d+\)/, "").trim() || "";

    const authorRaw = getElemIfExists("作家名");
    const author = authorRaw?.replace(/\nお気に入り作家に登録する/i, "").trim() || "";

    const genreRaw = getElemIfExists("ジャンル");
    const genre = genreRaw ? genreRaw.split(",").map((item) => item.trim()) : [];

    const eventName = getElemIfExists("イベント");

    const publishedAtRaw = getElemIfExists("発行日");
    const publishedAt = publishedAtRaw
      ? publishedAtRaw.replace(/^(\d{4})\/(\d{2})\/(\d{2})/, "$1-$2-$3").trim()
      : null;

    return {
      title,
      authors: author ? [author] : [],
      circleName,
      genre,
      eventName,
      publishedAt,
      url,
    };
  } catch (error) {
    console.error('Error scraping Melonbooks data:', error);
    return null;
  }
}