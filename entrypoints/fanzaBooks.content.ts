import { fanzaBooksSite } from "../src/sites/fanzaBooks";

export default defineContentScript({
  matches: [...fanzaBooksSite.matches],
  main: () => import("../src/contentScript/FanzaBooks"),
});
