import { fanzaAnimeSite } from "../src/sites/fanzaAnime";

export default defineContentScript({
  matches: [...fanzaAnimeSite.matches],
  main: () => import("../src/contentScript/FanzaAnime"),
});
