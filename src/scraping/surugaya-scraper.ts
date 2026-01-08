/**
 * Pure function to scrape Surugaya data from the DOM
 */

export interface SurugayaScrapedData {
  title: string;
  authors: string[];
  publisher: string | null;
  publishedAt: Date | null;
  url: string;
}

export function scrapeSurugayaData(document: Document): SurugayaScrapedData | null {
  try {
    const titleElement = document.querySelector("#item_title");
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    const mainTable = document.querySelector(
      "#item_detailInfo > div:nth-child(1) > table"
    ) as HTMLElement;

    if (!mainTable) return null;

    const result = {
      authors: [] as string[],
      publisher: null as string | null,
      publishedAt: null as string | null,
    };

    const rows = Array.from(mainTable.querySelectorAll("tr"));

    rows.forEach((row) => {
      const ths = row.querySelectorAll("th.text-right");
      const tds = row.querySelectorAll("td");

      ths.forEach((th, index) => {
        const headerText = th.textContent?.trim();
        const cellText = tds[index]?.textContent?.trim();

        switch (headerText) {
          case "画":
            if (cellText) result.authors.push(cellText);
            break;
          case "出版社":
            result.publisher = cellText || null;
            break;
          case "発売日":
            result.publishedAt = cellText || null;
            break;
        }
      });
    });

    const publishedAt = result.publishedAt ? new Date(result.publishedAt) : null;

    return {
      title,
      authors: result.authors,
      publisher: result.publisher,
      publishedAt,
      url,
    };
  } catch (error) {
    console.error('Error scraping Surugaya data:', error);
    return null;
  }
}