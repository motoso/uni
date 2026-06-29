import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import { scrapeBookWalkerData } from "../scraping/bookwalker-scraper";
import { BookWalkerScrapedData } from "../scraping/types";

/**
 * Bookwalkerのページを開いたときに実行される
 * https://bookwalker.jp/dea73feaf6-9f21-4c46-ac85-991153a0b71b/
 */
class BookWalker extends DetailContentScript<BookWalkerScrapedData> {
  protected readonly SERVICE = AcceptedService.bookWalker;
  protected readonly rootElementMountPoint = {
    target: () =>
      document.getElementsByClassName("header")[0] ||
      document.querySelector("header") ||
      document.querySelector("nav"),
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): BookWalkerScrapedData | null {
    return scrapeBookWalkerData(document);
  }

  protected createProduct(scrapedData: BookWalkerScrapedData): Book {
    // background scriptに送る
    return Book.make(
      this.SERVICE,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      this.publishedAt(scrapedData.publishedAt),
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
