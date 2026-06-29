// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { AcceptedService } from "../constant";
import Film from "../Film";
import { scrapeFanzaAnimeData } from "../scraping/fanza-anime-scraper";
import { FanzaAnimeScrapedData } from "../scraping/types";

class FanzaAnime extends DetailContentScript<FanzaAnimeScrapedData> {
  protected readonly SERVICE = AcceptedService.fanzaAnime;
  // SPAで本文が後から描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): FanzaAnimeScrapedData | null {
    return scrapeFanzaAnimeData(document);
  }

  protected createProduct(scrapedData: FanzaAnimeScrapedData): Film {
    return Film.make(
      AcceptedService.fanzaAnime,
      scrapedData.title,
      scrapedData.actress,
      scrapedData.director,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      scrapedData.label,
      scrapedData.manufacturerProductNumber,
    );
  }
}

const f = new FanzaAnime();
f.execute();
