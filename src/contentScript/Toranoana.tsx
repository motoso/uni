import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeToranoanaData } from "../scraping/toranoana-scraper";

/**
 * とらのあなのページを開いたときに実行される
 * https://ec.toranoana.jp/tora_r/ec/item/
 */
class Toranoana extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.toranoana;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    // 表示用のエレメント作成
    const divElementForBar = document.createElement("div");
    divElementForBar.id = this.ROOT_ELEM;
    // サイトの適当な要素につける
    const header = document.querySelector("header");
    header.appendChild(divElementForBar);
  }

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Doujinshi {
    const scrapedData = scrapeToranoanaData(document);

    if (!scrapedData) {
      return null;
    }

    const publishedAt = scrapedData.publishedAt
      ? dayjs(scrapedData.publishedAt)
      : dayjs();

    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.toranoana,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      publishedAt,
      scrapedData.circleName,
      scrapedData.eventName || "",
    );
  }
}

const f = new Toranoana();
f.execute();
