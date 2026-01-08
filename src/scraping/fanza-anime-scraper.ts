/**
 * Pure function to scrape FANZA Anime data from the DOM
 */

export interface FanzaAnimeScrapedData {
  title: string;
  actress: string[];
  director: string | null;
  label: string;
  publishedAt: Date;
  id: string;
  manufacturerProductNumber: string;
  url: string;
}

export function scrapeFanzaAnimeData(document: Document): FanzaAnimeScrapedData | null {
  try {
    console.log('[FANZA Anime] Starting scraping process...');
    console.log('[FANZA Anime] Page URL:', document.location?.href);

    // Try multiple title selectors (modern SPA style first, then legacy)
    let titleElement = document.querySelector("h1.font-semibold") ||
                       document.querySelector("h1") ||
                       document.getElementById("title");

    console.log('[FANZA Anime] Title element found:', !!titleElement);
    console.log('[FANZA Anime] Available h1 elements:', document.querySelectorAll('h1').length);

    // Debug: Check document ready state and other potential title elements
    console.log('[FANZA Anime] Document ready state:', document.readyState);
    console.log('[FANZA Anime] All headings found:');
    ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
      const elements = document.querySelectorAll(tag);
      console.log(`[FANZA Anime] ${tag}: ${elements.length}`);
      if (elements.length > 0) {
        Array.from(elements).forEach((el, i) => {
          console.log(`[FANZA Anime] ${tag}[${i}]:`, el.textContent?.trim().substring(0, 50));
        });
      }
    });

    if (!titleElement) {
      console.log('[FANZA Anime] No title element found with any selector');
      return null;
    }

    const title = titleElement.textContent?.replace(/【.*】/, "").trim() || '';
    console.log('[FANZA Anime] Title content:', titleElement.textContent);
    console.log('[FANZA Anime] Final title:', title);
    const url = document.location?.href || '';

    if (!title) {
      console.log('[FANZA Anime] Title is empty after processing');
      return null;
    }

    // Try multiple table selectors (modern SPA style first, then legacy)
    const table = document.querySelector("table.text-xs.shrink") as HTMLTableElement ||
                  document.querySelector("table.mg-b20") as HTMLTableElement;

    if (!table) return null;

    // Helper function to get index of row by key (updated for modern structure)
    const getIndex = (key: string): number => {
      const rows = Array.from(table.rows);
      return rows.findIndex((row) => {
        const cells = row.cells;
        if (cells.length === 0) return false;
        const cellText = cells[0]?.textContent?.trim() || '';
        return cellText === key || cellText.indexOf(key) === 0;
      });
    };

    // Alternative: search by text content in the entire table
    const getValueByLabel = (labelText: string): string | null => {
      // First try table row approach
      const rowIndex = getIndex(labelText);
      if (rowIndex >= 0 && table.rows[rowIndex]?.cells[1]) {
        return table.rows[rowIndex].cells[1].textContent?.trim() || null;
      }

      // Fallback: search for the label text anywhere in the table
      const allCells = Array.from(table.querySelectorAll('td, th'));
      const labelCell = allCells.find(cell =>
        cell.textContent?.trim() === labelText
      );

      if (labelCell) {
        // Try to find the next cell with the value
        let nextCell = labelCell.nextElementSibling;
        if (nextCell && nextCell.textContent) {
          return nextCell.textContent.trim();
        }
      }

      return null;
    };

    // For now, actress is empty as per the original logic
    const actress: string[] = [];

    // For now, director is empty as per the original logic
    const director = "";

    // Use the improved getValueByLabel function
    const label = getValueByLabel("レーベル") || "";

    const publishedAtStr = getValueByLabel("配信開始日") || "";
    const dateMatch = publishedAtStr.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    const publishedAt = dateMatch
      ? new Date(dateMatch.slice(1).join("-"))
      : new Date();

    const id = getValueByLabel("品番") || "";
    const manufacturerProductNumber = getValueByLabel("メーカー品番") || "";

    return {
      title,
      actress,
      director: director === "" ? null : director,
      label,
      publishedAt,
      id,
      manufacturerProductNumber,
      url,
    };
  } catch (error) {
    console.error('Error scraping FANZA Anime data:', error);
    return null;
  }
}