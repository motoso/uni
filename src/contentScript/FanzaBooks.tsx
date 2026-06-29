import Book from "../Book";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import { scrapeFanzaBooksData } from "../scraping/fanza-books-scraper";

/**
 * FANZAのページを開いたときに実行される
 * https://book.dmm.co.jp/detail/*
 */
class FanzaBooks extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanza;
  // 2023年4月ごろのアップデートでBFFで後から動的に情報を取得するようになったため、
  // DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  /**
   * Fanzaのページから必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Book {
    const scrapedData = scrapeFanzaBooksData(document);

    if (!scrapedData) {
      return null;
    }

    // background scriptに送る
    return Book.make(
      AcceptedService.fanza,
      scrapedData.title,
      scrapedData.authors ?? null,
      scrapedData.url,
      scrapedData.publisher,
      scrapedData.label,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
    );
  }
}

const f = new FanzaBooks();
f.execute();
