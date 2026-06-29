import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import { scrapeDLsiteBooksData } from "../scraping/dlsite-books-scraper";
import { DLsiteBooksScrapedData } from "../scraping/types";

/**
 * DLSite booksのページを開いたときに実行される
 * https://www.dlsite.com/books/work/=/product_id/BJ183632.html
 */
class DLsiteBooks extends DetailContentScript<DLsiteBooksScrapedData> {
  protected readonly SERVICE = AcceptedService.dlsite;
  protected readonly rootElementMountPoint = { target: "#header" };

  protected scrapeData(): DLsiteBooksScrapedData | null {
    return scrapeDLsiteBooksData(document);
  }

  protected createProduct(scrapedData: DLsiteBooksScrapedData): Book {
    // background scriptに送る
    return Book.make(
      AcceptedService.dlsite,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      this.publishedAt(scrapedData.publishedAt),
    );
  }
}

const f = new DLsiteBooks();
f.execute();
