import Book from "../Book";
import { AcceptedService } from "../constant";
import { scrapeAmazonData } from "../scraping/amazon-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const amazonSite = defineProductSite({
  id: "amazon",
  service: AcceptedService.amazon,
  hosts: ["www.amazon.co.jp"],
  matches: [
    "https://www.amazon.co.jp/dp/*",
    "https://www.amazon.co.jp/*/dp/*",
    "https://www.amazon.co.jp/gp/product/*",
  ],
  productTypes: ["book"],
  contentScriptEntry: "amazon",
  scraper: scrapeAmazonData,
  createProduct: (data) =>
    Book.make(
      AcceptedService.amazon,
      data.title,
      data.authors,
      data.url,
      data.publisher,
      null,
      toPublishedAt(data.publishedAt),
    ),
});
