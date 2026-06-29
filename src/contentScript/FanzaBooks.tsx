import Book from "../Book";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import { scrapeFanzaBooksData } from "../scraping/fanza-books-scraper";
import { FanzaBooksScrapedData } from "../scraping/types";

/**
 * FANZAのページを開いたときに実行される
 * https://book.dmm.co.jp/detail/*
 */
class FanzaBooks extends DetailContentScript<FanzaBooksScrapedData> {
  protected readonly SERVICE = AcceptedService.fanza;
  // 2023年4月ごろのアップデートでBFFで後から動的に情報を取得するようになったため、
  // DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): FanzaBooksScrapedData | null {
    return scrapeFanzaBooksData(document);
  }

  protected createProduct(scrapedData: FanzaBooksScrapedData): Book {
    // background scriptに送る
    return Book.make(
      AcceptedService.fanza,
      scrapedData.title,
      scrapedData.authors ?? null,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      this.publishedAt(scrapedData.publishedAt),
    );
  }
}

const f = new FanzaBooks();
f.execute();
