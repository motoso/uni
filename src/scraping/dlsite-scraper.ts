/**
 * Pure function to scrape DLsite data from the DOM
 */

export interface DLsiteScrapedData {
  title: string;
  authors: string[];
  voiceActors: string[];
  illustrators: string[];
  writers: string[];
  circleName: string | null;
  eventName: string | null;
  publishedAt: string | null;
  url: string;
  productType: string;
}

export function scrapeDLsiteData(document: Document): DLsiteScrapedData | null {
  try {
    const titleElement = document.getElementById("work_name");
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || '';
    const url = document.location?.href || '';

    const table = document.getElementById("work_maker");
    const outlineTable = document.getElementById("work_outline");

    // Helper function to get element from table if left header matches
    const getElemIfExists = (leftHeaderStr: string, sourceTable: HTMLElement | null): string | null => {
      if (!sourceTable) return null;

      const rows = Array.from((sourceTable as HTMLTableElement).rows);
      const filtered = rows.filter(
        (row) => row.cells[0]?.textContent === leftHeaderStr,
      );
      if (filtered.length > 0) {
        return filtered[0].cells[1]?.textContent?.trim() || null;
      }
      return null;
    };

    // Extract basic info
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
    const voiceActorInfo = getElemIfExists("声優", table);
    const illustratorInfo = getElemIfExists("イラスト", table);
    const writerInfo = getElemIfExists("シナリオ", table);
    const publishedAt = getElemIfExists("販売日", outlineTable);
    const eventName = getElemIfExists("イベント", outlineTable);

    // Parse voice actors
    const voiceActors: string[] = [];
    if (voiceActorInfo) {
      const actors = voiceActorInfo.split(/[,、・]/).map(name => name.trim()).filter(name => name.length > 0);
      voiceActors.push(...actors);
    }

    // Parse illustrators
    const illustrators: string[] = [];
    if (illustratorInfo) {
      const artists = illustratorInfo.split(/[,、・]/).map(name => name.trim()).filter(name => name.length > 0);
      illustrators.push(...artists);
    }

    // Parse writers
    const writers: string[] = [];
    if (writerInfo) {
      const scriptWriters = writerInfo.split(/[,、・]/).map(name => name.trim()).filter(name => name.length > 0);
      writers.push(...scriptWriters);
    }

    // Authors is a combination of illustrators and writers
    const authors = [...new Set([...illustrators, ...writers])];

    // Determine product type based on content
    let productType = "Doujinshi";
    if (voiceActors.length > 0) {
      productType = "ASMR";
    }

    return {
      title,
      authors,
      voiceActors,
      illustrators,
      writers,
      circleName,
      eventName,
      publishedAt,
      url,
      productType
    };
  } catch (error) {
    console.error('Error scraping DLsite data:', error);
    return null;
  }
}