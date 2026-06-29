// CSSを有効にする
import "../organism/Bar.scss";

import { BaseContentScript } from "./BaseContentScript";
import { AcceptedService } from "../constant";
import dayjs from "dayjs";
import Film from "../Film";
import { scrapeFc2ContentMarketData } from "../scraping/fc2-content-market-scraper";

class FC2ContentMarket extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fc2ContentMarket;

  protected createElementForBar(): void {
    // ヘッダー直後に要素を配置する
    const header = document.querySelector("header");

    // より安全なinsertAdjacentElementを使用
    this.mountRootElement(header, "afterend");
  }

  protected scrape(): Film {
    const scrapedData = scrapeFc2ContentMarketData(document);

    if (!scrapedData) {
      return null;
    }

    // background scriptに送る
    return Film.make(
      this.SERVICE,
      scrapedData.title,
      [], // actress
      scrapedData.director === "" ? null : scrapedData.director,
      scrapedData.url,
      scrapedData.publishedAt ? dayjs(scrapedData.publishedAt) : null,
      "", // label
      scrapedData.id,
    );
  }
}

const f = new FC2ContentMarket();
f.execute();
