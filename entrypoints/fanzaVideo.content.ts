import { fanzaVideoSite } from "../src/sites/fanzaVideo";

export default defineContentScript({
  matches: [...fanzaVideoSite.matches],
  main: () => import("../src/contentScript/FanzaVideo"),
});
