import Film from "../Film";
import { AcceptedService } from "../constant";
import { scrapeMgstageData } from "../scraping/mgstage-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const mgstageSite = defineProductSite({
  id: "mgstage",
  service: AcceptedService.mgstage,
  hosts: ["www.mgstage.com"],
  matches: ["https://www.mgstage.com/product/product_detail/*"],
  productTypes: ["film"],
  contentScriptEntry: "mgstage",
  scraper: scrapeMgstageData,
  createProduct: (data) =>
    Film.make(
      AcceptedService.mgstage,
      data.title,
      data.actors,
      null,
      data.url,
      toPublishedAt(data.publishedAt),
      data.label,
      data.id,
    ),
});
