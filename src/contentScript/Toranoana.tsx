import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeToranoanaData } from "../scraping/toranoana-scraper";
import { ToranoanaScrapedData } from "../scraping/types";

/**
 * とらのあなのページを開いたときに実行される
 * https://ec.toranoana.jp/tora_r/ec/item/
 */
class Toranoana extends DetailContentScript<ToranoanaScrapedData> {
  protected readonly SERVICE = AcceptedService.toranoana;
  protected readonly rootElementMountPoint = { target: "header" };

  protected scrapeData(): ToranoanaScrapedData | null {
    return scrapeToranoanaData(document);
  }

  protected createProduct(scrapedData: ToranoanaScrapedData): Doujinshi {
    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.toranoana,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.circleName,
      scrapedData.eventName || "",
    );
  }
}

const f = new Toranoana();
f.execute();
