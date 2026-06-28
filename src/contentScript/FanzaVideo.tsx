// CSSを有効にする
import "../organism/Bar.scss";

import { BaseContentScript } from "./BaseContentScript";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import Film from "../Film";
import { scrapeFanzaVideoData } from "../scraping/fanza-video-scraper";

class FanzaVideo extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanzaVideo;
  // 本文が後から動的に描画されるため、DOMの変化を待って再scrapeする。
  protected readonly waitForDynamicContent = true;

  protected createElementForBar(): void {
    const rootElement = this.createRootElement();

    // ヘッダー直後に要素を配置する（www.dmm.co.jpの場合）
    const header = document.querySelector("header");

    if (header) {
      // より安全なinsertAdjacentElementを使用
      header.insertAdjacentElement("afterend", rootElement);
    } else {
      // headerが存在しない場合（video.dmm.co.jpなど）はbody直後に配置
      const body = document.querySelector("body");
      if (body && body.firstChild) {
        body.insertBefore(rootElement, body.firstChild);
      } else if (body) {
        body.appendChild(rootElement);
      }
    }
  }

  protected scrape(): Film {
    const scrapedData = scrapeFanzaVideoData(document);

    if (!scrapedData) {
      return null;
    }
    // background scriptに送る
    return Film.make(
      AcceptedService.fanzaVideo,
      scrapedData.title,
      scrapedData.actress,
      scrapedData.director,
      scrapedData.url,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
      scrapedData.label,
      scrapedData.id,
    );
  }
}

const f = new FanzaVideo();
f.execute();
