import { amazonSite } from "./amazon";
import { bookWalkerSite } from "./bookWalker";
import { dlsiteBooksSite } from "./dlsiteBooks";
import { dlsiteManiaxSite } from "./dlsiteManiax";
import { fanzaAnimeSite } from "./fanzaAnime";
import { fanzaBooksSite } from "./fanzaBooks";
import { fanzaDoujinSite } from "./fanzaDoujin";
import { fanzaVideoSite } from "./fanzaVideo";
import { fc2ContentMarketSite } from "./fc2ContentMarket";
import { melonbooksSite } from "./melonbooks";
import { surugayaSite } from "./surugaya";
import { toranoanaSite } from "./toranoana";

/**
 * Framework-independent source of truth for product-page integrations.
 *
 * Phase 7b can adapt this plain registry to WXT entrypoint metadata without
 * coupling scraper or product creation code to the extension framework.
 */
export const productSiteRegistry = [
  fanzaBooksSite,
  fanzaDoujinSite,
  fanzaVideoSite,
  fanzaAnimeSite,
  dlsiteBooksSite,
  dlsiteManiaxSite,
  toranoanaSite,
  melonbooksSite,
  amazonSite,
  bookWalkerSite,
  fc2ContentMarketSite,
  surugayaSite,
] as const;
