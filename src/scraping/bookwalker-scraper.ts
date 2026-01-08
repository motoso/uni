/**
 * Pure function to scrape BookWalker book data from the DOM
 */

export interface BookWalkerScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  label: string | null;
  publishedAt: string | null;
  url: string;
}

export function scrapeBookWalkerData(document: Document): BookWalkerScrapedData | null {
  try {
    const titleElement = document.querySelector("h1");
    if (!titleElement) return null;

    let title = titleElement.textContent?.trim() || '';
    // 【コミック版】みたいな情報は除去（ただし【推しの子】は除外）
    title = title.replace(/【(?!推しの子).*?】/g, "").trim();

    const url = document.location?.href || '';

    // Helper function to get info by label from definition list structure
    const getInfoByLabel = (labelText: string): string => {
      // まず定義リスト構造（dt/dd）で検索
      const dtElements = Array.from(document.querySelectorAll('dt'));
      for (const dt of dtElements) {
        if (dt.textContent?.trim() === labelText) {
          const dd = dt.nextElementSibling as HTMLElement;
          if (dd && dd.tagName === 'DD') {
            const link = dd.querySelector('a');
            return link ? link.textContent?.trim() || "" : dd.textContent?.trim() || "";
          }
        }
      }

      // フォールバック: 全要素検索
      const elements = Array.from(document.querySelectorAll('*'));
      for (const element of elements) {
        if (element.textContent?.trim() === labelText) {
          let nextElement = element.nextElementSibling;
          if (nextElement) {
            const link = nextElement.querySelector('a');
            return link ? link.textContent?.trim() || "" : nextElement.textContent?.trim() || "";
          }
        }
      }
      return "";
    };

    const publisher = getInfoByLabel("出版社") || null;
    const label = getInfoByLabel("レーベル") || null;
    const publishedAt = getInfoByLabel("配信開始日") || null;

    // Extract authors - look for author information
    const authors: string[] = [];
    const authorInfo = getInfoByLabel("著者");
    if (authorInfo) {
      // Split by common separators and clean up
      const authorNames = authorInfo.split(/[,、・]/).map(name => name.trim()).filter(name => name.length > 0);
      for (const name of authorNames) {
        // Remove common suffixes like (著), (原作), etc.
        const cleanName = name.replace(/\s*[(（][^)）]*[)）]\s*/g, '').trim();
        if (cleanName && !authors.includes(cleanName)) {
          authors.push(cleanName);
        }
      }
    }

    // Convert full-width characters to half-width if needed
    const convertToHalfWidth = (str: string): string => {
      return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    };

    return {
      title,
      authors,
      publisher,
      label,
      publishedAt: publishedAt ? convertToHalfWidth(publishedAt) : null,
      url
    };
  } catch (error) {
    console.error('Error scraping BookWalker data:', error);
    return null;
  }
}