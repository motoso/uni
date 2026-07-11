import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { DLsiteManiaxScrapedData } from "../scraping/types";
import { dlsiteManiaxSite } from "../sites/dlsiteManiax";

/**
 * DLSite maniaxやがるまに
 * を開いたときに実行される
 */
class DLsiteManiax extends DetailContentScript<DLsiteManiaxScrapedData> {
  protected readonly rootElementMountPoint = { target: "#header" };

  protected scrapeData(): DLsiteManiaxScrapedData | null {
    return dlsiteManiaxSite.scraper(document);
  }

  protected createProduct(scrapedData: DLsiteManiaxScrapedData) {
    return dlsiteManiaxSite.createProduct(scrapedData);
  }
}

const scraper = new DLsiteManiax();
scraper.execute();
