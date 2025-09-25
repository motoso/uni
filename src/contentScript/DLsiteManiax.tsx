import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import Doujinshi from "../Doujinshi";
import Asmr from "../Asmr";
import Product from "../Product";
import { scrapeDLsiteManiaxData } from "../scraping/dlsite-maniax-scraper";

/**
 * DLSite maniaxやがるまに
 * を開いたときに実行される
 */
class DLsiteManiax extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.dlsiteManiax;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    const divElement = document.createElement("div");
    divElement.id = this.ROOT_ELEM;
    const header = document.getElementById("header");
    header.appendChild(divElement);
  }

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Product {
    const scrapedData = scrapeDLsiteManiaxData(document);

    if (!scrapedData) {
      return null;
    }

    const publishedAt = dayjs(scrapedData.publishedAt);

    switch (scrapedData.type) {
      case "ボイス・ASMR":
        return Asmr.make(
          AcceptedService.dlsiteManiax,
          scrapedData.title,
          scrapedData.authors,
          scrapedData.url,
          publishedAt,
          scrapedData.circleName,
          scrapedData.eventName,
          scrapedData.illustrators,
          scrapedData.voiceActors,
          scrapedData.writers,
        );
      default:
        // background scriptに送る
        return Doujinshi.make(
          AcceptedService.dlsiteManiax,
          scrapedData.title,
          scrapedData.authors,
          scrapedData.url,
          publishedAt,
          scrapedData.circleName,
          scrapedData.eventName,
        );
    }
  }
}

const scraper = new DLsiteManiax();
scraper.execute();
