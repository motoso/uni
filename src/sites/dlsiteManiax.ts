import Asmr from "../Asmr";
import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import {
  DLSITE_MANIAX_ASMR_TYPE,
  scrapeDLsiteManiaxData,
} from "../scraping/dlsite-maniax-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const dlsiteManiaxSite = defineProductSite({
  id: "dlsiteManiax",
  service: AcceptedService.dlsiteManiax,
  hosts: ["www.dlsite.com"],
  matches: [
    "https://www.dlsite.com/maniax/work/=/product_id/*",
    "https://www.dlsite.com/home/work/=/product_id/*",
    "https://www.dlsite.com/girls/work/=/product_id/*",
    "https://www.dlsite.com/aix/work/=/product_id/*",
  ],
  productTypes: ["asmr", "doujinshi"],
  contentScriptEntry: "dlsiteManiax",
  scraper: scrapeDLsiteManiaxData,
  createProduct: (data) =>
    data.type === DLSITE_MANIAX_ASMR_TYPE
      ? Asmr.make(
          AcceptedService.dlsiteManiax,
          data.title,
          data.authors,
          data.url,
          toPublishedAt(data.publishedAt),
          data.circleName,
          data.eventName,
          data.illustrators,
          data.voiceActors,
          data.writers,
        )
      : Doujinshi.make(
          AcceptedService.dlsiteManiax,
          data.title,
          data.authors,
          data.url,
          toPublishedAt(data.publishedAt),
          data.circleName,
          data.eventName,
        ),
});
