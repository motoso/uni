import Film from "../Film";
import { AcceptedService } from "../constant";
import { scrapeFanzaVideoData } from "../scraping/fanza-video-scraper";
import { defineProductSite } from "./types";
import { toPublishedAt } from "./toPublishedAt";

export const fanzaVideoSite = defineProductSite({
  id: "fanzaVideo",
  service: AcceptedService.fanzaVideo,
  hosts: ["www.dmm.co.jp", "video.dmm.co.jp"],
  matches: [
    "https://www.dmm.co.jp/digital/videoa/-/detail/=/*",
    "https://video.dmm.co.jp/av/content/*",
  ],
  productTypes: ["film"],
  contentScriptEntry: "fanzaVideo",
  scraper: scrapeFanzaVideoData,
  createProduct: (data) =>
    Film.make(
      AcceptedService.fanzaVideo,
      data.title,
      data.actress,
      data.director,
      data.url,
      toPublishedAt(data.publishedAt),
      data.label,
      data.id,
    ),
});
