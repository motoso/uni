import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeSurugayaData } from "../scraping/surugaya-scraper";

/**
 * 駿河屋のページを開いたときに実行される
 * https://www.suruga-ya.jp/product/detail/*
 *
 * ページスクショ：
 * https://gyazo.com/369f88d61f358ea642d91964e5c682fc
 */
class Surugaya extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.surugaya;
  protected readonly rootElementMountPoint = {
    target: "body > div.dialog-off-canvas-main-canvas > header > div.top_nav",
  };

  /**
   * ページから必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Doujinshi {
    const scrapedData = scrapeSurugayaData(document);

    if (!scrapedData) {
      return null;
    }

    const publishedAt = scrapedData.publishedAt
      ? dayjs(scrapedData.publishedAt)
      : null;

    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.surugaya,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      publishedAt,
      scrapedData.publisher,
      null,
    );
  }
}

const Scraper = new Surugaya();
Scraper.execute();
