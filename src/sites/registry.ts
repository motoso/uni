import { AcceptedService } from "../constant";
import {
  scrapeAmazonData,
  scrapeBookWalkerData,
  scrapeDLsiteBooksData,
  scrapeDLsiteManiaxData,
  scrapeFanzaAnimeData,
  scrapeFanzaBooksData,
  scrapeFanzaDoujinData,
  scrapeFanzaVideoData,
  scrapeFc2ContentMarketData,
  scrapeMelonbooksData,
  scrapeSurugayaData,
  scrapeToranoanaData,
} from "../scraping";

type ProductType = "asmr" | "book" | "doujinshi" | "film";
type Scraper = (document: Document) => unknown;

export type SiteDefinition = Readonly<{
  service: AcceptedService;
  hosts: readonly string[];
  matches: readonly string[];
  productTypes: readonly ProductType[];
  scraper: Scraper | null;
  productFactory: string;
  contentScriptEntry: string;
  contentScriptOutput: string;
}>;

/**
 * Framework-independent source of truth for supported site entrypoints.
 *
 * Phase 5 deliberately does not generate webpack or manifest configuration
 * from this registry. WXT will consume this metadata after Phase 7b.
 * `productFactory` is a stable name because factories currently live inside
 * side-effectful content-script entrypoints and must not be imported here.
 */
export const siteRegistry = {
  fanzaBooks: {
    service: AcceptedService.fanza,
    hosts: ["book.dmm.co.jp"],
    matches: ["https://book.dmm.co.jp/*"],
    productTypes: ["book"],
    scraper: scrapeFanzaBooksData,
    productFactory: "FanzaBooks.createProduct",
    contentScriptEntry: "contentScript/FanzaBooks.tsx",
    contentScriptOutput: "fanzaBooks",
  },
  fanzaDoujin: {
    service: AcceptedService.fanzaDojin,
    hosts: ["www.dmm.co.jp"],
    matches: ["https://www.dmm.co.jp/dc/doujin/-/detail/=/*"],
    productTypes: ["doujinshi"],
    scraper: scrapeFanzaDoujinData,
    productFactory: "FanzaDoujin.createProduct",
    contentScriptEntry: "contentScript/FanzaDoujin.tsx",
    contentScriptOutput: "fanzaDoujin",
  },
  fanzaVideo: {
    service: AcceptedService.fanzaVideo,
    hosts: ["www.dmm.co.jp", "video.dmm.co.jp"],
    matches: [
      "https://www.dmm.co.jp/digital/videoa/-/detail/=/*",
      "https://video.dmm.co.jp/av/content/*",
    ],
    productTypes: ["film"],
    scraper: scrapeFanzaVideoData,
    productFactory: "FanzaVideo.createProduct",
    contentScriptEntry: "contentScript/FanzaVideo.tsx",
    contentScriptOutput: "fanzaVideo",
  },
  fanzaAnime: {
    service: AcceptedService.fanzaAnime,
    hosts: ["video.dmm.co.jp"],
    matches: ["https://video.dmm.co.jp/anime/content/*"],
    productTypes: ["film"],
    scraper: scrapeFanzaAnimeData,
    productFactory: "FanzaAnime.createProduct",
    contentScriptEntry: "contentScript/FanzaAnime.tsx",
    contentScriptOutput: "fanzaAnime",
  },
  dlsiteBooks: {
    service: AcceptedService.dlsite,
    hosts: ["www.dlsite.com"],
    matches: ["https://www.dlsite.com/books/work/=/product_id/*"],
    productTypes: ["book"],
    scraper: scrapeDLsiteBooksData,
    productFactory: "DLsiteBooks.createProduct",
    contentScriptEntry: "contentScript/DLsiteBooks.tsx",
    contentScriptOutput: "dlsite",
  },
  dlsiteManiax: {
    service: AcceptedService.dlsiteManiax,
    hosts: ["www.dlsite.com"],
    matches: [
      "https://www.dlsite.com/maniax/work/=/product_id/*",
      "https://www.dlsite.com/home/work/=/product_id/*",
      "https://www.dlsite.com/girls/work/=/product_id/*",
      "https://www.dlsite.com/aix/work/=/product_id/*",
    ],
    productTypes: ["doujinshi", "asmr"],
    scraper: scrapeDLsiteManiaxData,
    productFactory: "DLsiteManiax.createProduct",
    contentScriptEntry: "contentScript/DLsiteManiax.tsx",
    contentScriptOutput: "dlsiteManiax",
  },
  toranoana: {
    service: AcceptedService.toranoana,
    hosts: ["ec.toranoana.jp", "ecs.toranoana.jp"],
    matches: [
      "https://ec.toranoana.jp/tora_r/ec/item/*",
      "https://ecs.toranoana.jp/tora/ec/item/*",
    ],
    productTypes: ["doujinshi"],
    scraper: scrapeToranoanaData,
    productFactory: "Toranoana.createProduct",
    contentScriptEntry: "contentScript/Toranoana.tsx",
    contentScriptOutput: "toranoana",
  },
  melonbooks: {
    service: AcceptedService.melonbooks,
    hosts: ["www.melonbooks.co.jp"],
    matches: ["https://www.melonbooks.co.jp/detail/detail.php*"],
    productTypes: ["doujinshi"],
    scraper: scrapeMelonbooksData,
    productFactory: "Melonbooks.createProduct",
    contentScriptEntry: "contentScript/Melonbooks.tsx",
    contentScriptOutput: "melonbooks",
  },
  amazon: {
    service: AcceptedService.amazon,
    hosts: ["www.amazon.co.jp"],
    matches: [
      "https://www.amazon.co.jp/dp/*",
      "https://www.amazon.co.jp/*/dp/*",
      "https://www.amazon.co.jp/gp/product/*",
    ],
    productTypes: ["book"],
    scraper: scrapeAmazonData,
    productFactory: "Amazon.createProduct",
    contentScriptEntry: "contentScript/Amazon.tsx",
    contentScriptOutput: "amazon",
  },
  bookWalker: {
    service: AcceptedService.bookWalker,
    hosts: ["bookwalker.jp"],
    matches: ["https://bookwalker.jp/*"],
    productTypes: ["book"],
    scraper: scrapeBookWalkerData,
    productFactory: "BookWalker.createProduct",
    contentScriptEntry: "contentScript/BookWalker.tsx",
    contentScriptOutput: "bookWalker",
  },
  fc2ContentMarket: {
    service: AcceptedService.fc2ContentMarket,
    hosts: ["adult.contents.fc2.com"],
    matches: ["https://adult.contents.fc2.com/article/*"],
    productTypes: ["film"],
    scraper: scrapeFc2ContentMarketData,
    productFactory: "FC2ContentMarket.createProduct",
    contentScriptEntry: "contentScript/Fc2ContentMarket.tsx",
    contentScriptOutput: "fc2ContentMarket",
  },
  surugaya: {
    service: AcceptedService.surugaya,
    hosts: ["www.suruga-ya.jp"],
    matches: ["https://www.suruga-ya.jp/product/detail/*"],
    productTypes: ["doujinshi"],
    scraper: scrapeSurugayaData,
    productFactory: "Surugaya.createProduct",
    contentScriptEntry: "contentScript/Surugaya.tsx",
    contentScriptOutput: "surugaya",
  },
  dmmBasket: {
    service: AcceptedService.dmmDoujinBasket,
    hosts: ["www.dmm.co.jp"],
    matches: ["https://www.dmm.co.jp/dc/doujin/-/basket/*"],
    productTypes: ["doujinshi"],
    scraper: null,
    productFactory: "DMMBasketCheckerConfig.createProduct",
    contentScriptEntry: "contentScript/DMMBasket.tsx",
    contentScriptOutput: "DMMBasket",
  },
  dlsiteCart: {
    service: AcceptedService.dlsite,
    hosts: ["www.dlsite.com"],
    matches: [
      "https://www.dlsite.com/home/cart*",
      "https://www.dlsite.com/maniax/cart*",
      "https://www.dlsite.com/girls/cart*",
      "https://www.dlsite.com/aix/cart*",
    ],
    productTypes: ["doujinshi"],
    scraper: null,
    productFactory: "DLsiteCartCheckerConfig.createProduct",
    contentScriptEntry: "contentScript/DLsiteCart.tsx",
    contentScriptOutput: "DLsiteCart",
  },
} as const satisfies Record<string, SiteDefinition>;
