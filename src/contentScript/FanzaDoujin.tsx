import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeFanzaDoujinData } from "../scraping/fanza-doujin-scraper";
import { FanzaDoujinScrapedData } from "../scraping/types";

/**
 * FANZAのページを開いたときに実行される
 */
class FanzaDoujin extends DetailContentScript<FanzaDoujinScrapedData> {
  protected readonly SERVICE = AcceptedService.fanzaDojin;
  protected readonly rootElementMountPoint = {
    target: () => document.getElementsByTagName("header")[0] ?? null,
    prepareTarget: (target: Element) => {
      // appendした子要素も高さに含んでほしい
      (target as HTMLElement).style.height = "auto";
    },
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): FanzaDoujinScrapedData | null {
    return scrapeFanzaDoujinData(document);
  }

  protected createProduct(scrapedData: FanzaDoujinScrapedData): Doujinshi {
    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.fanzaDojin,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.circleName,
      null,
    );
  }
}

const f = new FanzaDoujin();
f.execute();
