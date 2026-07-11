import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { AmazonScrapedData } from "../scraping/types";
import { amazonSite } from "../sites/amazon";

/**
 * Amazonのページを開いたときに実行される
 */
class Amazon extends DetailContentScript<AmazonScrapedData> {
  protected readonly rootElementMountPoint = { target: "#navbar" };

  protected scrapeData(): AmazonScrapedData | null {
    return amazonSite.scraper(document);
  }

  protected createProduct(scrapedData: AmazonScrapedData) {
    return amazonSite.createProduct(scrapedData);
  }
}

const f = new Amazon();
f.execute();
