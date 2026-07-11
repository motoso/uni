import { fanzaDoujinSite } from "../src/sites/fanzaDoujin";

export default defineContentScript({
  matches: [...fanzaDoujinSite.matches],
  main: () => import("../src/contentScript/FanzaDoujin"),
});
