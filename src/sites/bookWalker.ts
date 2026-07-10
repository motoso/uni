import Book from "../Book";
import { AcceptedService } from "../constant";
import { scrapeBookWalkerData } from "../scraping/bookwalker-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const bookWalkerSite = defineProductSite({
  id: "bookWalker",
  service: AcceptedService.bookWalker,
  hosts: ["bookwalker.jp"],
  matches: ["https://bookwalker.jp/*"],
  productTypes: ["book"],
  contentScriptEntry: "bookWalker",
  scraper: scrapeBookWalkerData,
  createProduct: (data) =>
    Book.make(
      AcceptedService.bookWalker,
      data.title,
      data.authors,
      data.url,
      data.publisher,
      data.label,
      toPublishedAt(data.publishedAt),
    ),
});
