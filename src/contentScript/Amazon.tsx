import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import { DetailContentScript } from "./DetailContentScript";
import { scrapeAmazonData } from "../scraping/amazon-scraper";
import { AmazonScrapedData } from "../scraping/types";

/**
 * Amazonのページを開いたときに実行される
 */
class Amazon extends DetailContentScript<AmazonScrapedData> {
  protected readonly SERVICE = AcceptedService.amazon;
  protected readonly rootElementMountPoint = { target: "#navbar" };

  protected scrapeData(): AmazonScrapedData | null {
    return scrapeAmazonData(document);
  }

  protected createProduct(scrapedData: AmazonScrapedData): Book {
    // background scriptに送る
    return Book.make(
      this.SERVICE,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      null, // label
      this.publishedAt(scrapedData.publishedAt),
    );
  }
}

const f = new Amazon();
f.execute();
