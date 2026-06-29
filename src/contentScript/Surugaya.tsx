import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeSurugayaData } from "../scraping/surugaya-scraper";
import { SurugayaScrapedData } from "../scraping/types";

/**
 * 駿河屋のページを開いたときに実行される
 * https://www.suruga-ya.jp/product/detail/*
 *
 * ページスクショ：
 * https://gyazo.com/369f88d61f358ea642d91964e5c682fc
 */
class Surugaya extends DetailContentScript<SurugayaScrapedData> {
  protected readonly SERVICE = AcceptedService.surugaya;
  protected readonly rootElementMountPoint = {
    target: "body > div.dialog-off-canvas-main-canvas > header > div.top_nav",
  };

  protected scrapeData(): SurugayaScrapedData | null {
    return scrapeSurugayaData(document);
  }

  protected createProduct(scrapedData: SurugayaScrapedData): Doujinshi {
    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.surugaya,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.publisher,
      null,
    );
  }
}

const Scraper = new Surugaya();
Scraper.execute();
