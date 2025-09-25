import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import { scrapeBookWalkerData } from "../scraping/bookwalker-scraper";

/**
 * Bookwalkerのページを開いたときに実行される
 * https://bookwalker.jp/dea73feaf6-9f21-4c46-ac85-991153a0b71b/
 */
class BookWalker extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.bookWalker;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    const rootElement = this.createRootElement();

    // 複数の候補を試す
    let targetElement =
      document.getElementsByClassName("header")[0] ||
      document.querySelector("header") ||
      document.querySelector("nav") ||
      document.body;

    if (targetElement === document.body) {
      // bodyの最初の子要素として挿入
      document.body.insertBefore(rootElement, document.body.firstChild);
    } else {
      targetElement.appendChild(rootElement);
    }
  }

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Book {
    const scrapedData = scrapeBookWalkerData(document);

    if (!scrapedData) {
      return null;
    }

    // Parse publishedAt if available
    let publishedAt = dayjs();
    if (scrapedData.publishedAt) {
      const dateMatch = scrapedData.publishedAt.match(
        /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      );
      if (dateMatch) {
        publishedAt = dayjs(dateMatch.slice(1).join("-"));
      }
    }

    // background scriptに送る
    return Book.make(
      this.SERVICE,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      publishedAt,
    );
  }

  execute() {
    const path = window.location.pathname;
    // 商品ページ以外では実行しない
    // ex: https://bookwalker.jp/de1555ea82-436c-4c74-a65c-6717544a6998/
    const isProductPage =
      /^\/[0-9a-f]{10}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//.test(
        path,
      );
    if (isProductPage) {
      super.execute();
    }
  }
}

const f = new BookWalker();
f.execute();
