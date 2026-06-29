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
  protected readonly rootElementMountPoint = { target: "header" };

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
      : null;

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
