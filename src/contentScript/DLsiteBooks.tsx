import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import { scrapeDLsiteBooksData } from "../scraping/dlsite-books-scraper";

/**
 * DLSite booksのページを開いたときに実行される
 * https://www.dlsite.com/books/work/=/product_id/BJ183632.html
 */
class DLsiteBooks extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.dlsite;
  protected readonly rootElementMountPoint = { target: "#header" };

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Book {
    const scrapedData = scrapeDLsiteBooksData(document);

    if (!scrapedData) {
      return null;
    }

    // background scriptに送る
    return Book.make(
      AcceptedService.dlsite,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
    );
  }
}

const f = new DLsiteBooks();
f.execute();
