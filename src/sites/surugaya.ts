import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import { scrapeSurugayaData } from "../scraping/surugaya-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const surugayaSite = defineProductSite({
  id: "surugaya",
  service: AcceptedService.surugaya,
  hosts: ["www.suruga-ya.jp"],
  matches: ["https://www.suruga-ya.jp/product/detail/*"],
  productTypes: ["doujinshi"],
  contentScriptEntry: "surugaya",
  scraper: scrapeSurugayaData,
  createProduct: (data) =>
    Doujinshi.make(
      AcceptedService.surugaya,
      data.title,
      data.authors,
      data.url,
      toPublishedAt(data.publishedAt),
      data.publisher,
      null,
    ),
});
