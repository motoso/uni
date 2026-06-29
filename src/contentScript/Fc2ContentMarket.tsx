// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { AcceptedService } from "../constant";
import Film from "../Film";
import { scrapeFc2ContentMarketData } from "../scraping/fc2-content-market-scraper";
import { Fc2ContentMarketScrapedData } from "../scraping/types";

class FC2ContentMarket extends DetailContentScript<Fc2ContentMarketScrapedData> {
  protected readonly SERVICE = AcceptedService.fc2ContentMarket;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): Fc2ContentMarketScrapedData | null {
    return scrapeFc2ContentMarketData(document);
  }

  protected createProduct(scrapedData: Fc2ContentMarketScrapedData): Film {
    // background scriptに送る
    return Film.make(
      this.SERVICE,
      scrapedData.title,
      [], // actress
      scrapedData.director === "" ? null : scrapedData.director,
      scrapedData.url,
      this.publishedAt(scrapedData.publishedAt),
      "", // label
      scrapedData.id,
    );
  }
}

const f = new FC2ContentMarket();
f.execute();
