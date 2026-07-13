import { amazonSite } from "../src/sites/amazon";

export default defineContentScript({
  matches: [...amazonSite.matches],
  main: () => import("../src/contentScript/Amazon"),
});
