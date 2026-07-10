import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import { scrapeMelonbooksData } from "../scraping/melonbooks-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const melonbooksSite = defineProductSite({
  id: "melonbooks",
  service: AcceptedService.melonbooks,
  hosts: ["www.melonbooks.co.jp"],
  matches: ["https://www.melonbooks.co.jp/detail/detail.php*"],
  productTypes: ["doujinshi"],
  contentScriptEntry: "melonbooks",
  scraper: scrapeMelonbooksData,
  createProduct: (data) =>
    Doujinshi.make(
      AcceptedService.melonbooks,
      data.title,
      data.authors,
      data.url,
      toPublishedAt(data.publishedAt),
      data.circleName,
      data.eventName,
    ),
});
