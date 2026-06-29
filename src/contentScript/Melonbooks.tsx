import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import Doujinshi from "../Doujinshi";
import { scrapeMelonbooksData } from "../scraping/melonbooks-scraper";
import { MelonbooksScrapedData } from "../scraping/types";

/**
 * メロンブックスのページを開いたときに実行される
 */
class Melonbooks extends DetailContentScript<MelonbooksScrapedData> {
  protected readonly SERVICE = AcceptedService.melonbooks;
  protected readonly rootElementMountPoint = { target: "#header_free_html" };

  protected scrapeData(): MelonbooksScrapedData | null {
    return scrapeMelonbooksData(document);
  }

  protected createProduct(scrapedData: MelonbooksScrapedData): Doujinshi {
    // background scriptに送る
    return Doujinshi.make(
      AcceptedService.melonbooks,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.circleName,
      scrapedData.eventName,
    );
  }
}

const f = new Melonbooks();
f.execute();
