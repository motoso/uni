/**
 * Pure function to scrape DLsite Maniax data from the DOM
 */

export interface DLsiteManiaxScrapedData {
  title: string;
  type: string;
  authors: string[];
  voiceActors: string[];
  illustrators: string[];
  writers: string[];
  circleName: string;
  eventName: string | null;
  publishedAt: Date;
  url: string;
}

export function scrapeDLsiteManiaxData(document: Document): DLsiteManiaxScrapedData | null {
  try {
    const titleElement = document.getElementById("work_name");
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    const table = document.getElementById("work_maker");
    const outlineTable = document.getElementById("work_outline");

    if (!table || !outlineTable) return null;

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string, sourceTable: HTMLElement): string | null => {
      const rows = Array.from((sourceTable as HTMLTableElement).rows);
      const filtered = rows.filter(
        (row) => row.cells[0]?.textContent === leftHeaderStr,
      );
      if (filtered.length > 0) {
        return filtered[0].cells[1]?.textContent || null;
      }
      return null;
    };

    const type = getElemIfExists("作品形式", outlineTable) || "";

    // Parse authors, voice actors, illustrators, and writers
    const authorsStr = getElemIfExists("作者", outlineTable);
    const authors = authorsStr?.split("/").map((s) => s.trim()).filter(s => s) || [];

    const voiceActorsStr = getElemIfExists("声優", outlineTable);
    const voiceActors = voiceActorsStr?.split("/").map((s) => s.trim()).filter(s => s) || [];

    const illustratorsStr = getElemIfExists("イラスト", outlineTable);
    const illustrators = illustratorsStr?.split("/").map((s) => s.trim()).filter(s => s) || [];

    const writersStr = getElemIfExists("シナリオ", outlineTable);
    const writers = writersStr?.split("/").map((s) => s.trim()).filter(s => s) || [];

    // Extract circle name (remove follow button text and additional UI text)
    const circleNameRaw = getElemIfExists("サークル名", table);
    let circleName = "";
    if (circleNameRaw) {
      // Remove everything after newline, "フォローする", and numbers
      circleName = circleNameRaw
        .split('\n')[0] // Take first line only
        .replace(/\s*フォローする.*$/, '') // Remove "フォローする" and everything after
        .replace(/\s+\d+.*$/, '') // Remove numbers and everything after
        .trim();
    }

    const eventName = getElemIfExists("イベント", outlineTable);

    // Parse published date (YYYY年MM月DD日 -> Date)
    const publishedAtStr = getElemIfExists("販売日", outlineTable);
    const dateMatch = publishedAtStr?.match(/(\d{4})年(\d{2})月(\d{2})日/);
    const publishedAt = dateMatch
      ? new Date(dateMatch.slice(1).join("-"))
      : new Date();

    return {
      title,
      type,
      authors,
      voiceActors,
      illustrators,
      writers,
      circleName,
      eventName,
      publishedAt,
      url,
    };
  } catch (error) {
    console.error('Error scraping DLsite Maniax data:', error);
    return null;
  }
}