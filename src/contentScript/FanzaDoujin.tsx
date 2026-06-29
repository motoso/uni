import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeFanzaDoujinData } from "../scraping/fanza-doujin-scraper";

/**
 * FANZAのページを開いたときに実行される
 */
class FanzaDoujin extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanzaDojin;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    // サイトの適当な要素につける
    const header = document.getElementsByTagName("header")[0];
    if (header) {
      // appendした子要素も高さに含んでほしい
      header.style.height = "auto";
      this.mountRootElement(header);
    } else {
      // headerがない場合はbodyの最初に追加
      this.mountRootElementAtBodyStart();
    }
  }

  /**
   * Fanzaのページから必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Doujinshi {
    const scrapedData = scrapeFanzaDoujinData(document);

    if (!scrapedData) {
      return null;
    }

    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.fanzaDojin,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
      scrapedData.circleName,
      null,
    );
  }
}

const f = new FanzaDoujin();
f.execute();
