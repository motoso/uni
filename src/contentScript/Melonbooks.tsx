import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { MelonbooksScrapedData } from "../scraping/types";
import { melonbooksSite } from "../sites/melonbooks";

/**
 * メロンブックスのページを開いたときに実行される
 */
class Melonbooks extends DetailContentScript<MelonbooksScrapedData> {
  protected readonly SERVICE = melonbooksSite.service;
  protected readonly rootElementMountPoint = { target: "#header_free_html" };

  protected scrapeData(): MelonbooksScrapedData | null {
    return melonbooksSite.scraper(document);
  }

  protected createProduct(scrapedData: MelonbooksScrapedData) {
    return melonbooksSite.createProduct(scrapedData);
  }
}

const f = new Melonbooks();
f.execute();
