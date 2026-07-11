import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import { FanzaDoujinScrapedData } from "../scraping/types";
import { fanzaDoujinSite } from "../sites/fanzaDoujin";

/**
 * FANZAのページを開いたときに実行される
 */
class FanzaDoujin extends DetailContentScript<FanzaDoujinScrapedData> {
  protected readonly rootElementMountPoint = {
    target: () => document.getElementsByTagName("header")[0] ?? null,
    prepareTarget: (target: Element) => {
      // appendした子要素も高さに含んでほしい
      (target as HTMLElement).style.height = "auto";
    },
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): FanzaDoujinScrapedData | null {
    return fanzaDoujinSite.scraper(document);
  }

  protected createProduct(scrapedData: FanzaDoujinScrapedData) {
    return fanzaDoujinSite.createProduct(scrapedData);
  }
}

const f = new FanzaDoujin();
f.execute();
