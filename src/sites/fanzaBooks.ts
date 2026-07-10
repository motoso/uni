import Book from "../Book";
import { AcceptedService } from "../constant";
import { scrapeFanzaBooksData } from "../scraping/fanza-books-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const fanzaBooksSite = defineProductSite({
  id: "fanzaBooks",
  service: AcceptedService.fanza,
  hosts: ["book.dmm.co.jp"],
  matches: ["https://book.dmm.co.jp/*"],
  productTypes: ["book"],
  contentScriptEntry: "fanzaBooks",
  scraper: scrapeFanzaBooksData,
  createProduct: (data) =>
    Book.make(
      AcceptedService.fanza,
      data.title,
      data.authors ?? null,
      data.url,
      data.publisher,
      data.label,
      toPublishedAt(data.publishedAt),
    ),
});
