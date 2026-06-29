import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import {
  CartScrapboxCheckerConfig,
  mountCartScrapboxChecker,
} from "./CartScrapboxChecker";

const DMMBasketCheckerConfig: CartScrapboxCheckerConfig = {
  logPrefix: "[DMM Basket Checker]",
  missingProjectNameMessage:
    "[DMM Basket Checker] Scrapbox project name is not set in Chrome storage. Please set it in the extension options.",
  observerTargetSelector: "ul.basket-list",
  observerTargetDescription: "ul.basket-list",
  itemSelector: "li.basket-listItem",
  createProduct: (item) => {
    const titleAnchor =
      item.querySelector<HTMLAnchorElement>("b.basket-name a");
    const title = titleAnchor?.innerText.trim();
    if (!title) {
      return null;
    }

    return Doujinshi.make(
      AcceptedService.dmmDoujinBasket,
      title,
      [],
      titleAnchor?.href || window.location.href,
      null,
      item.querySelector<HTMLElement>("p.basket-circle a")?.innerText?.trim() ||
        null,
      null,
    );
  },
  insertLinksContainer: (item, linksContainer) => {
    const circleElement = item.querySelector<HTMLElement>("p.basket-circle");
    const titleElement = item.querySelector<HTMLElement>("b.basket-name");
    const parentOfCircleOrTitle =
      item.querySelector<HTMLElement>(".basket-txtContent");

    if (circleElement?.parentNode) {
      circleElement.parentNode.insertBefore(
        linksContainer,
        circleElement.nextSibling,
      );
    } else if (titleElement?.parentNode) {
      titleElement.parentNode.insertBefore(
        linksContainer,
        titleElement.nextSibling,
      );
    } else if (parentOfCircleOrTitle) {
      parentOfCircleOrTitle.appendChild(linksContainer);
    } else {
      item
        .querySelector<HTMLElement>(".basket-descCol")
        ?.appendChild(linksContainer);
    }
  },
};

mountCartScrapboxChecker("dmm-basket-checker-root", DMMBasketCheckerConfig);
