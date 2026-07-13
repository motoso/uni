import { fc2ContentMarketSite } from "../src/sites/fc2ContentMarket";

export default defineContentScript({
  matches: [...fc2ContentMarketSite.matches],
  main: () => import("../src/contentScript/Fc2ContentMarket"),
});
