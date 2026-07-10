import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import { scrapeFanzaDoujinData } from "../scraping/fanza-doujin-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const fanzaDoujinSite = defineProductSite({
  id: "fanzaDoujin",
  service: AcceptedService.fanzaDojin,
  hosts: ["www.dmm.co.jp"],
  matches: ["https://www.dmm.co.jp/dc/doujin/-/detail/=/*"],
  productTypes: ["doujinshi"],
  contentScriptEntry: "fanzaDoujin",
  scraper: scrapeFanzaDoujinData,
  createProduct: (data) =>
    Doujinshi.make(
      AcceptedService.fanzaDojin,
      data.title,
      data.authors,
      data.url,
      toPublishedAt(data.publishedAt),
      data.circleName,
      null,
    ),
});
