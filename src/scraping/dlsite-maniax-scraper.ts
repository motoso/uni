/**
 * Pure function to scrape DLsite Maniax data from the DOM
 */

export const DLSITE_MANIAX_ASMR_TYPE = "ボイス・ASMR";

export interface DLsiteManiaxScrapedData {
  title: string;
  type: string;
  authors: string[];
  voiceActors: string[];
  illustrators: string[];
  writers: string[];
  circleName: string;
  eventName: string | null;
  publishedAt: Date | null;
  url: string;
}

export function scrapeDLsiteManiaxData(
  document: Document,
): DLsiteManiaxScrapedData | null {
  const parsePublishedAt = (value: string | null): Date | null => {
    const dateMatch = value?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!dateMatch) return null;

    const [, year, month, day] = dateMatch;
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  };

  try {
    const titleElement = document.getElementById("work_name");
    if (!titleElement) return null;

    const normalizeText = (value: string | null | undefined): string =>
      value?.replace(/\s+/g, " ").trim() || "";

    const title = normalizeText(titleElement.textContent);
    const url = document.location?.href || "";

    const table = document.getElementById("work_maker");
    const outlineTable = document.getElementById("work_outline");

    if (!table || !outlineTable) return null;

    // Helper function to get element from table if left header matches
    const getCellIfExists = (
      leftHeaderStr: string,
      sourceTable: HTMLElement,
    ): HTMLTableCellElement | null => {
      const rows = Array.from((sourceTable as HTMLTableElement).rows);
      const filtered = rows.filter(
        (row) => normalizeText(row.cells[0]?.textContent) === leftHeaderStr,
      );
      if (filtered.length > 0) {
        return filtered[0].cells[1] || null;
      }
      return null;
    };

    const getElemIfExists = (
      leftHeaderStr: string,
      sourceTable: HTMLElement,
    ): string | null => {
      const cell = getCellIfExists(leftHeaderStr, sourceTable);
      return cell ? normalizeText(cell.textContent) : null;
    };

    const getLinkedNamesIfExists = (
      leftHeaderStr: string,
      sourceTable: HTMLElement,
    ): string[] => {
      const cell = getCellIfExists(leftHeaderStr, sourceTable);
      if (!cell) return [];

      const names = Array.from(cell.querySelectorAll("a"))
        .map((anchor) => normalizeText(anchor.textContent))
        .filter((name) => name.length > 0);

      return names;
    };

    const type = getElemIfExists("作品形式", outlineTable) || "";

    // Parse authors, voice actors, illustrators, and writers
    const authors = getLinkedNamesIfExists("作者", outlineTable);

    const voiceActors = getLinkedNamesIfExists("声優", outlineTable);

    const illustrators = getLinkedNamesIfExists("イラスト", outlineTable);

    const writers = getLinkedNamesIfExists("シナリオ", outlineTable);

    // Extract circle name (remove follow button text and additional UI text)
    const circleName =
      normalizeText(
        getCellIfExists("サークル名", table)?.querySelector(".maker_name a")
          ?.textContent,
      ) || "";

    const eventName = getElemIfExists("イベント", outlineTable);

    const publishedAtStr = getElemIfExists("販売日", outlineTable);
    const publishedAt = parsePublishedAt(publishedAtStr);

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
    console.error("Error scraping DLsite Maniax data:", error);
    return null;
  }
}
