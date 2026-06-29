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
  protected readonly rootElementMountPoint = { target: "#header_free_html" };

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Doujinshi {
    const scrapedData = scrapeMelonbooksData(document);

    if (!scrapedData) {
      return null;
    }

    const publishedAt = scrapedData.publishedAt
      ? dayjs(scrapedData.publishedAt)
      : null;

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
