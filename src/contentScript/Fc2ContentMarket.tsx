// CSSを有効にする
import "../organism/Bar.scss";

import { DetailContentScript } from "./DetailContentScript";
import { Fc2ContentMarketScrapedData } from "../scraping/types";
import { fc2ContentMarketSite } from "../sites/fc2ContentMarket";

class FC2ContentMarket extends DetailContentScript<Fc2ContentMarketScrapedData> {
  protected readonly SERVICE = fc2ContentMarketSite.service;
  protected readonly rootElementMountPoint = {
    target: "header",
    position: "afterend" as const,
  };

  protected scrapeData(): Fc2ContentMarketScrapedData | null {
    return fc2ContentMarketSite.scraper(document);
  }

  protected createProduct(scrapedData: Fc2ContentMarketScrapedData) {
    return fc2ContentMarketSite.createProduct(scrapedData);
  }
}

const f = new FC2ContentMarket();
f.execute();
