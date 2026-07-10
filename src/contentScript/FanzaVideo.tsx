// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { FanzaVideoScrapedData } from "../scraping/types";
import { fanzaVideoSite } from "../sites/fanzaVideo";

class FanzaVideo extends DetailContentScript<FanzaVideoScrapedData> {
  protected readonly SERVICE = fanzaVideoSite.service;
  // 本文が後から動的に描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): FanzaVideoScrapedData | null {
    return fanzaVideoSite.scraper(document);
  }

  protected createProduct(scrapedData: FanzaVideoScrapedData) {
    return fanzaVideoSite.createProduct(scrapedData);
  }
}

const f = new FanzaVideo();
f.execute();
