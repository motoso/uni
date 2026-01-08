import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeMelonbooksData } from "../scraping/melonbooks-scraper";

/**
 * メロンブックスのページを開いたときに実行される
 */
class Melonbooks extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.melonbooks;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    // 表示用のエレメント作成
    const divElementForBar = document.createElement("div");
    divElementForBar.id = this.ROOT_ELEM;
    // サイトの適当な要素につける
    const header = document.querySelector("#header_free_html");
    header.appendChild(divElementForBar);
  }

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Doujinshi {
    const scrapedData = scrapeMelonbooksData(document);

    if (!scrapedData) {
      return null;
    }

    // Parse publishedAt if available
    const publishedAt = scrapedData.publishedAt
      ? dayjs(scrapedData.publishedAt)
      : dayjs();

    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.melonbooks,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      publishedAt,
      scrapedData.circleName,
      scrapedData.eventName,
    );
  }
}

const f = new Melonbooks();
f.execute();
