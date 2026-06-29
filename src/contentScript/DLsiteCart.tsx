import DLsiteProduct from "../DLsiteProduct";
import { AcceptedService } from "../constant";
import {
  CartScrapboxCheckerConfig,
  mountCartScrapboxChecker,
} from "./CartScrapboxChecker";

const DLsiteCartCheckerConfig: CartScrapboxCheckerConfig = {
  logPrefix: "[DLsite Cart Checker]",
  missingProjectNameMessage:
    "[DLsite Cart Checker] Scrapbox project name is not set. Please set it in the extension options.",
  observerTargetSelector: ".payment_cart_list ul.cart_list",
  observerTargetDescription: ".payment_cart_list ul.cart_list",
  itemSelector: "li.cart_list_item",
  initialItemSelector: "div#cart_wrapper li.cart_list_item._cart_items",
  initialItemFilter: (item) => item.offsetParent !== null,
  createProduct: (item) => {
    const titleAnchor = item.querySelector<HTMLAnchorElement>(".work_name > a");
    const title = titleAnchor?.innerText.trim();
    if (!title) {
      return null;
    }

    const makerName = item
      .querySelector<HTMLAnchorElement>(".maker_name > a")
      ?.innerText.trim();

    return new DLsiteProduct(
      AcceptedService.dlsite,
      title,
      makerName ? [makerName] : [],
      titleAnchor?.href || window.location.href,
    );
  },
  insertLinksContainer: (item, linksContainer) => {
    const workContentElement = item.querySelector<HTMLElement>(".work_content");
    if (workContentElement) {
      workContentElement.appendChild(linksContainer);
    } else {
      item.appendChild(linksContainer);
    }
  },
};

mountCartScrapboxChecker("dlsite-cart-checker-root", DLsiteCartCheckerConfig);
