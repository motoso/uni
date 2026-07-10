import Book from "../Book";
import { AcceptedService } from "../constant";
import { scrapeDLsiteBooksData } from "../scraping/dlsite-books-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const dlsiteBooksSite = defineProductSite({
  id: "dlsiteBooks",
  service: AcceptedService.dlsite,
  hosts: ["www.dlsite.com"],
  matches: ["https://www.dlsite.com/books/work/=/product_id/*"],
  productTypes: ["book"],
  contentScriptEntry: "dlsite",
  scraper: scrapeDLsiteBooksData,
  createProduct: (data) =>
    Book.make(
      AcceptedService.dlsite,
      data.title,
      data.authors,
      data.url,
      data.publisher,
      data.label,
      toPublishedAt(data.publishedAt),
    ),
});
