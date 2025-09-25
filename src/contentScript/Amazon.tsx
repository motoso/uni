import Book from "../Book";
import * as React from "react";
import "../organism/Bar.scss";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import { BaseContentScript } from "./BaseContentScript";
import { scrapeAmazonData } from "../scraping/amazon-scraper";

/**
 * Amazonのページを開いたときに実行される
 */
class Amazon extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.amazon;

  /**
   * バー表示用のdiv要素を生成
   * @private
   */
  protected createElementForBar() {
    const rootElement = this.createRootElement();

    const header = document.getElementById("navbar");
    header.appendChild(rootElement);
  }

  /**
   * 必要な情報をスクレイピングする
   * @private
   */
  protected scrape(): Book {
    const scrapedData = scrapeAmazonData(document);

    if (!scrapedData) {
      return null;
    }

    // Parse publishedAt if available
    let publishedAt = dayjs();
    if (scrapedData.publishedAt) {
      // Try to parse various date formats
      const dateStr = scrapedData.publishedAt;
      if (dateStr.includes("/")) {
        publishedAt = dayjs(dateStr.split("/").join("-"));
      } else {
        publishedAt = dayjs(dateStr);
      }
    }

    // background scriptに送る
    return Book.make(
      this.SERVICE,
      scrapedData.title,
      scrapedData.authors,
      scrapedData.url,
      scrapedData.publisher,
      null, // label
      publishedAt,
    );
  }
}

const f = new Amazon();
f.execute();
