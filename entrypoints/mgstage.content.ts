import { mgstageSite } from "../src/sites/mgstage";

export default defineContentScript({
  matches: [...mgstageSite.matches],
  main: () => import("../src/contentScript/Mgstage"),
});
