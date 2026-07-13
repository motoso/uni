import { dlsiteBooksSite } from "../src/sites/dlsiteBooks";

export default defineContentScript({
  matches: [...dlsiteBooksSite.matches],
  main: () => import("../src/contentScript/DLsiteBooks"),
});
