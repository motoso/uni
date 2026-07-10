// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { FanzaAnimeScrapedData } from "../scraping/types";
import { fanzaAnimeSite } from "../sites/fanzaAnime";

class FanzaAnime extends DetailContentScript<FanzaAnimeScrapedData> {
  protected readonly SERVICE = fanzaAnimeSite.service;
  // SPAで本文が後から描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): FanzaAnimeScrapedData | null {
    return fanzaAnimeSite.scraper(document);
  }

  protected createProduct(scrapedData: FanzaAnimeScrapedData) {
    return fanzaAnimeSite.createProduct(scrapedData);
  }
}

const f = new FanzaAnime();
f.execute();
