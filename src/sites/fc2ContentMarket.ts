import Film from "../Film";
import { AcceptedService } from "../constant";
import { scrapeFc2ContentMarketData } from "../scraping/fc2-content-market-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const fc2ContentMarketSite = defineProductSite({
  id: "fc2ContentMarket",
  service: AcceptedService.fc2ContentMarket,
  hosts: ["adult.contents.fc2.com"],
  matches: ["https://adult.contents.fc2.com/article/*"],
  productTypes: ["film"],
  contentScriptEntry: "fc2ContentMarket",
  scraper: scrapeFc2ContentMarketData,
  createProduct: (data) =>
    Film.make(
      AcceptedService.fc2ContentMarket,
      data.title,
      [],
      data.director === "" ? null : data.director,
      data.url,
      toPublishedAt(data.publishedAt),
      "",
      data.id,
    ),
});
