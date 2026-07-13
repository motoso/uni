import { toranoanaSite } from "../src/sites/toranoana";

export default defineContentScript({
  matches: [...toranoanaSite.matches],
  main: () => import("../src/contentScript/Toranoana"),
});
