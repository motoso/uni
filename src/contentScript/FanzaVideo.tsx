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
    // ヘッダー直後に要素を配置する（www.dmm.co.jpの場合）
    const header = document.querySelector("header");

    if (header) {
      // より安全なinsertAdjacentElementを使用
      this.mountRootElement(header, "afterend");
    } else {
      // headerが存在しない場合（video.dmm.co.jpなど）はbody直後に配置
      this.mountRootElementAtBodyStart();
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
