import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { ToranoanaScrapedData } from "../scraping/types";
import { toranoanaSite } from "../sites/toranoana";

/**
 * とらのあなのページを開いたときに実行される
 * https://ec.toranoana.jp/tora_r/ec/item/
 */
class Toranoana extends DetailContentScript<ToranoanaScrapedData> {
  protected readonly SERVICE = toranoanaSite.service;
  protected readonly rootElementMountPoint = { target: "header" };

  protected scrapeData(): ToranoanaScrapedData | null {
    return toranoanaSite.scraper(document);
  }

  protected createProduct(scrapedData: ToranoanaScrapedData) {
    return toranoanaSite.createProduct(scrapedData);
  }
}

const f = new Toranoana();
f.execute();
