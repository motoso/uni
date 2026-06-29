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
  protected readonly rootElementMountPoint = {
    target: () => document.getElementsByTagName("header")[0] ?? null,
    prepareTarget: (target: Element) => {
      // appendした子要素も高さに含んでほしい
      (target as HTMLElement).style.height = "auto";
    },
    fallback: "bodyStart" as const,
  };

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
