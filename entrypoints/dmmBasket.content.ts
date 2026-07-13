export default defineContentScript({
  matches: ["https://www.dmm.co.jp/dc/doujin/-/basket/*"],
  main: () => import("../src/contentScript/DMMBasket"),
});
