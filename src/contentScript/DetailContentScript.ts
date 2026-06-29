import dayjs from "dayjs";
import Product from "../Product";
import { BaseContentScript } from "./BaseContentScript";

export abstract class DetailContentScript<
  TScrapedData,
> extends BaseContentScript {
  protected abstract scrapeData(): TScrapedData | null;

  protected abstract createProduct(scrapedData: TScrapedData): Product;

  protected scrape(): Product | null {
    const scrapedData = this.scrapeData();
    if (!scrapedData) {
      return null;
    }

    return this.createProduct(scrapedData);
  }

  protected publishedAt(date: Date | null): dayjs.Dayjs | null {
    return date ? dayjs(date) : null;
  }
}
