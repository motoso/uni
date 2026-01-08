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

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    const textarea = document.createElement("div");
    textarea.id = this.ROOT_ELEM;
    const header = document.querySelector("header");
    header.parentNode.insertBefore(textarea, header.nextSibling);
  }

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
      dayjs(scrapedData.publishedAt),
    );
  }
}

// 2023年4月ごろのアップデートでBFFで後から動的に情報を取得するようになった
// これに対応するためにはMutationObserverを使い、対象のDOMが更新されたのかをwatchする必要がある
// そんなコードを書くのは面倒なので1秒まつ
setTimeout(function () {
  const f = new FanzaBooks();
  f.execute();
}, 3000); // 2000ミリ秒（2秒）待機する
