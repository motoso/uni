import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import Doujinshi from "../Doujinshi";
import Asmr from "../Asmr";
import Product from "../Product";
import {
  DLSITE_MANIAX_ASMR_TYPE,
  scrapeDLsiteManiaxData,
} from "../scraping/dlsite-maniax-scraper";
import { DLsiteManiaxScrapedData } from "../scraping/types";

/**
 * DLSite maniaxやがるまに
 * を開いたときに実行される
 */
class DLsiteManiax extends DetailContentScript<DLsiteManiaxScrapedData> {
  protected readonly SERVICE = AcceptedService.dlsiteManiax;
  protected readonly rootElementMountPoint = { target: "#header" };

  protected scrapeData(): DLsiteManiaxScrapedData | null {
    return scrapeDLsiteManiaxData(document);
  }

  protected createProduct(scrapedData: DLsiteManiaxScrapedData): Product {
    switch (scrapedData.type) {
      case DLSITE_MANIAX_ASMR_TYPE:
        return Asmr.make(
          AcceptedService.dlsiteManiax,
          scrapedData.title,
          scrapedData.authors,
          scrapedData.url,
          this.publishedAt(scrapedData.publishedAt),
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
          this.publishedAt(scrapedData.publishedAt),
          scrapedData.circleName,
          scrapedData.eventName,
        );
    }
  }
}

const scraper = new DLsiteManiax();
scraper.execute();
