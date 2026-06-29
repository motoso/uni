// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { AcceptedService } from "../constant";
import Film from "../Film";
import { scrapeFanzaVideoData } from "../scraping/fanza-video-scraper";
import { FanzaVideoScrapedData } from "../scraping/types";

class FanzaVideo extends DetailContentScript<FanzaVideoScrapedData> {
  protected readonly SERVICE = AcceptedService.fanzaVideo;
  // 本文が後から動的に描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
    fallback: "bodyStart" as const,
  };

  protected scrapeData(): FanzaVideoScrapedData | null {
    return scrapeFanzaVideoData(document);
  }

  protected createProduct(scrapedData: FanzaVideoScrapedData): Film {
    // background scriptに送る
    return Film.make(
      AcceptedService.fanzaVideo,
      scrapedData.title,
      scrapedData.actress,
      scrapedData.director,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.label,
      scrapedData.id,
    );
  }
}

const f = new FanzaVideo();
f.execute();
