// CSSを有効にする
import "../organism/Bar.scss";

import { BaseContentScript } from "./BaseContentScript";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import Film from "../Film";
import { scrapeFanzaAnimeData } from "../scraping/fanza-anime-scraper";

class FanzaAnime extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanzaAnime;
  // SPAで本文が後から描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;

  protected createElementForBar(): void {
    const rootElement = this.createRootElement();

    // ヘッダー直後に要素を配置する
    const header = document.querySelector("header");

    // より安全なinsertAdjacentElementを使用
    header.insertAdjacentElement("afterend", rootElement);
  }

  protected scrape(): Film | null {
    const scrapedData = scrapeFanzaAnimeData(document);
    if (!scrapedData) {
      return null;
    }

    return Film.make(
      AcceptedService.fanzaAnime,
      scrapedData.title,
      scrapedData.actress,
      scrapedData.director,
      scrapedData.url,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
      scrapedData.label,
      scrapedData.manufacturerProductNumber,
    );
  }
}

const f = new FanzaAnime();
f.execute();
