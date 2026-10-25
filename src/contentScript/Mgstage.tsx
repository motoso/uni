import "../organism/Bar.scss";
import { DetailContentScript } from "./DetailContentScript";
import type { MgstageScrapedData } from "../scraping/types";
import { mgstageSite } from "../sites/mgstage";

class Mgstage extends DetailContentScript<MgstageScrapedData> {
  protected readonly rootElementMountPoint = {
    target: "#header",
    position: "afterend" as const,
  };

  protected scrapeData() {
    return mgstageSite.scraper(document);
  }

  protected createProduct(data: MgstageScrapedData) {
    return mgstageSite.createProduct(data);
  }
}

new Mgstage().execute();
