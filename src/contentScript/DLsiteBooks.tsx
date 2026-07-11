import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { DLsiteBooksScrapedData } from "../scraping/types";
import { dlsiteBooksSite } from "../sites/dlsiteBooks";

/**
 * DLSite booksのページを開いたときに実行される
 * https://www.dlsite.com/books/work/=/product_id/BJ183632.html
 */
class DLsiteBooks extends DetailContentScript<DLsiteBooksScrapedData> {
  protected readonly rootElementMountPoint = { target: "#header" };

  protected scrapeData(): DLsiteBooksScrapedData | null {
    return dlsiteBooksSite.scraper(document);
  }

  protected createProduct(scrapedData: DLsiteBooksScrapedData) {
    return dlsiteBooksSite.createProduct(scrapedData);
  }
}

const f = new DLsiteBooks();
f.execute();
