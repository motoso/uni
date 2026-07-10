import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import { scrapeToranoanaData } from "../scraping/toranoana-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const toranoanaSite = defineProductSite({
  id: "toranoana",
  service: AcceptedService.toranoana,
  hosts: ["ec.toranoana.jp", "ecs.toranoana.jp"],
  matches: [
    "https://ec.toranoana.jp/tora_r/ec/item/*",
    "https://ecs.toranoana.jp/tora/ec/item/*",
  ],
  productTypes: ["doujinshi"],
  contentScriptEntry: "toranoana",
  scraper: scrapeToranoanaData,
  createProduct: (data) =>
    Doujinshi.make(
      AcceptedService.toranoana,
      data.title,
      data.authors,
      data.url,
      toPublishedAt(data.publishedAt),
      data.circleName,
      data.eventName || "",
    ),
});
