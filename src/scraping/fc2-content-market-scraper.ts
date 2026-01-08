/**
 * Pure function to scrape FC2 Content Market data from the DOM
 */

export interface Fc2ContentMarketScrapedData {
  title: string;
  director: string;
  publishedAt: Date;
  id: string;
  url: string;
}

export function scrapeFc2ContentMarketData(document: Document): Fc2ContentMarketScrapedData | null {
  try {
    const titleElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > h3"
    );
    if (!titleElement) return null;

    const title = titleElement.textContent
      ?.replace(/【[^】]*】/g, "")
      .trim() || '';

    const url = document.location?.href || '';

    const directorElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > ul > li:nth-child(3) > a"
    );
    const director = directorElement?.textContent?.trim() || "";

    const publishedAtElement = document.querySelector(
      "#top > div.items_article_left > section.items_article_header > div > section > div.items_article_headerInfo > div:nth-child(5) > p"
    );
    const publishedAtStr = publishedAtElement?.textContent?.trim() || "";
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

    const idMatch = url.match(/\/article\/(\d+)\//);
    const id = idMatch ? idMatch[1] : "";

    return {
      title,
      director,
      publishedAt,
      id,
      url,
    };
  } catch (error) {
    console.error('Error scraping FC2 Content Market data:', error);
    return null;
  }
}