/**
 * Pure function to scrape DLsite Books data from the DOM
 */

export interface DLsiteBooksScrapedData {
  title: string;
  authors: string[];
  label: string | null;
  publisher: string;
  publishedAt: Date;
  url: string;
}

export function scrapeDLsiteBooksData(document: Document): DLsiteBooksScrapedData | null {
  try {
    const titleElement = document.getElementById("work_name");
    if (!titleElement) return null;

    // 【】で囲まれた部分を削除（非貪欲マッチで複数の【】に対応）
    // 例: "【電子単行本】タイトル【18禁】" → "タイトル"
    const title = titleElement.innerText.replace(/【.*?】/g, "").trim();
    const url = document.location.href;

    const table = document.getElementById("work_maker");
    const outlineTable = document.getElementById("work_outline");

    if (!table || !outlineTable) return null;

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string, sourceTable: HTMLElement): string | null => {
      const filtered = [...(sourceTable as HTMLTableElement).rows].filter(
        (row) => row.cells[0].innerText.trim() === leftHeaderStr,
      );
      if (filtered.length > 0) {
        return filtered[0].cells[1].innerText as string;
      }
      return null;
    };

    const authorsStr = getElemIfExists("著者", table);
    const authors = authorsStr?.split("/").map((s) => s.trim()) || [];

    const label = getElemIfExists("レーベル", table);

    const publisherStr = getElemIfExists("出版社名", table);
    // 出版社名\nフォローする\n1234 -> 出版社名
    const publisher = publisherStr?.match(/(^.*)\r?\n/)?.[1] || publisherStr || "";

    const publishedAtStr = getElemIfExists("販売日", outlineTable);
    // YYYY年MM月DD日 -> YYYY-MM-DD
    const dateMatch = publishedAtStr?.match(/(\d{4})年(\d{2})月(\d{2})日/);
    const publishedAt = dateMatch ? new Date(dateMatch.slice(1).join("-")) : new Date();

    return {
      title,
      authors,
      label,
      publisher,
      publishedAt,
      url,
    };
  } catch (error) {
    console.error('Error scraping DLsite Books data:', error);
    return null;
  }
}