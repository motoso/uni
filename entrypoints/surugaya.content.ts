import { surugayaSite } from "../src/sites/surugaya";

export default defineContentScript({
  matches: [...surugayaSite.matches],
  main: () => import("../src/contentScript/Surugaya"),
});
