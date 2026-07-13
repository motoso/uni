import { melonbooksSite } from "../src/sites/melonbooks";

export default defineContentScript({
  matches: [...melonbooksSite.matches],
  main: () => import("../src/contentScript/Melonbooks"),
});
