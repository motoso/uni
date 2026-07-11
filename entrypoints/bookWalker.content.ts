import { bookWalkerSite } from "../src/sites/bookWalker";

export default defineContentScript({
  matches: [...bookWalkerSite.matches],
  main: () => import("../src/contentScript/BookWalker"),
});
