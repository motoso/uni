export default defineContentScript({
  matches: [
    "https://www.dlsite.com/home/cart*",
    "https://www.dlsite.com/maniax/cart*",
    "https://www.dlsite.com/girls/cart*",
    "https://www.dlsite.com/aix/cart*",
  ],
  main: () => import("../src/contentScript/DLsiteCart"),
});
