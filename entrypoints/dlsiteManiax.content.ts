import { dlsiteManiaxSite } from "../src/sites/dlsiteManiax";

export default defineContentScript({
  matches: [...dlsiteManiaxSite.matches],
  main: () => import("../src/contentScript/DLsiteManiax"),
});
