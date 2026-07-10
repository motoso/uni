import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { SurugayaScrapedData } from "../scraping/types";
import { surugayaSite } from "../sites/surugaya";

/**
 * 駿河屋のページを開いたときに実行される
 * https://www.suruga-ya.jp/product/detail/*
 *
 * ページスクショ：
 * https://gyazo.com/369f88d61f358ea642d91964e5c682fc
 */
class Surugaya extends DetailContentScript<SurugayaScrapedData> {
  protected readonly SERVICE = surugayaSite.service;
  protected readonly rootElementMountPoint = {
    target: "body > div.dialog-off-canvas-main-canvas > header > div.top_nav",
  };

  protected scrapeData(): SurugayaScrapedData | null {
    return surugayaSite.scraper(document);
  }

  protected createProduct(scrapedData: SurugayaScrapedData) {
    return surugayaSite.createProduct(scrapedData);
  }
}

const Scraper = new Surugaya();
Scraper.execute();
