import Film from "../Film";
import { AcceptedService } from "../constant";
import { scrapeFanzaAnimeData } from "../scraping/fanza-anime-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const fanzaAnimeSite = defineProductSite({
  id: "fanzaAnime",
  service: AcceptedService.fanzaAnime,
  hosts: ["video.dmm.co.jp"],
  matches: ["https://video.dmm.co.jp/anime/content/*"],
  productTypes: ["film"],
  contentScriptEntry: "fanzaAnime",
  scraper: scrapeFanzaAnimeData,
  createProduct: (data) =>
    Film.make(
      AcceptedService.fanzaAnime,
      data.title,
      data.actress,
      data.director,
      data.url,
      toPublishedAt(data.publishedAt),
      data.label,
      data.manufacturerProductNumber,
    ),
});
