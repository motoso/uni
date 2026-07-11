import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { BookWalkerScrapedData } from "../scraping/types";
import { bookWalkerSite } from "../sites/bookWalker";

/**
 * Bookwalkerのページを開いたときに実行される
 * https://bookwalker.jp/dea73feaf6-9f21-4c46-ac85-991153a0b71b/
 */
class BookWalker extends DetailContentScript<BookWalkerScrapedData> {
  protected readonly rootElementMountPoint = {
    target: () =>
      document.getElementsByClassName("header")[0] ||
      document.querySelector("header") ||
      document.querySelector("nav"),
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): BookWalkerScrapedData | null {
    return bookWalkerSite.scraper(document);
  }

  protected createProduct(scrapedData: BookWalkerScrapedData) {
    return bookWalkerSite.createProduct(scrapedData);
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
