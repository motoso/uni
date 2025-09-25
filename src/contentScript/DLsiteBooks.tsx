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

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    const divElement = document.createElement("div");
    divElement.id = this.ROOT_ELEM;
    const header = document.getElementById("header");
    header.appendChild(divElement);
  }

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
      dayjs(scrapedData.publishedAt),
    );
  }
}

const f = new DLsiteBooks();
f.execute();
