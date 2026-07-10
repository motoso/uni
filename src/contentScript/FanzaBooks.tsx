import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { FanzaBooksScrapedData } from "../scraping/types";
import { fanzaBooksSite } from "../sites/fanzaBooks";

/**
 * FANZAのページを開いたときに実行される
 * https://book.dmm.co.jp/detail/*
 */
class FanzaBooks extends DetailContentScript<FanzaBooksScrapedData> {
  protected readonly SERVICE = fanzaBooksSite.service;
  // 2023年4月ごろのアップデートでBFFで後から動的に情報を取得するようになったため、
  // DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): FanzaBooksScrapedData | null {
    return fanzaBooksSite.scraper(document);
  }

  protected createProduct(scrapedData: FanzaBooksScrapedData) {
    return fanzaBooksSite.createProduct(scrapedData);
  }
}

const f = new FanzaBooks();
f.execute();
