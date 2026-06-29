import * as React from "react";
import { createRoot } from "react-dom/client";
import ScrapboxApiClient from "../scrapbox/scrapboxApi";
import Doujinshi from "../Doujinshi";
import { AcceptedService } from "../constant";
import { StorageKeyProjectName } from "../chromeApi";
import {
  CartScrapboxLinksDisplay,
  toCartScrapboxLinks,
} from "./cartScrapboxLinks";

const DMMBasketChecker = () => {
  const [projectName, setProjectName] = React.useState<string | null>(null);

  React.useEffect(() => {
    chrome.storage.sync.get([StorageKeyProjectName], (result) => {
      const storedProjectName = result[StorageKeyProjectName];
      if (typeof storedProjectName === "string" && storedProjectName.trim()) {
        setProjectName(storedProjectName);
      } else {
        console.warn(
          "[DMM Basket Checker] Scrapbox project name is not set in Chrome storage. Please set it in the extension options.",
        );
      }
    });
  }, []);

  const processCartItem = React.useCallback(
    async (
      item: HTMLElement,
      currentProjectName: string,
      processedItems: WeakSet<HTMLElement>,
    ) => {
      if (processedItems.has(item) || !currentProjectName) {
        return;
      }
      processedItems.add(item);

      const titleAnchor =
        item.querySelector<HTMLAnchorElement>("b.basket-name a");
      const title = titleAnchor?.innerText.trim();
      const itemUrl = titleAnchor?.href;

      if (title) {
        console.log(`[DMM Basket Checker] Checking: ${title}`);
        const apiClient = new ScrapboxApiClient();
        try {
          const product = Doujinshi.make(
            AcceptedService.dmmDoujinBasket, // service
            title, // title
            [], // authors
            itemUrl || window.location.href, // url
            null, // publishedAt
            (
              item.querySelector("p.basket-circle a") as HTMLElement
            )?.innerText?.trim() || null, // circleName (from brandName)
            null, // eventName (from seriesName)
          );

          const searchResult = await apiClient.search({ product });
          console.log(
            `[DMM Basket Checker] searchResult for "${title}":`,
            searchResult,
          ); // Log searchResult

          if (
            searchResult &&
            searchResult.count > 0 &&
            searchResult.pages &&
            searchResult.pages.length > 0
          ) {
            // Added checks for searchResult and searchResult.pages
            console.log(
              `[DMM Basket Checker] Found in Scrapbox: ${title}. Count: ${searchResult.count}, Pages:`,
              searchResult.pages,
            );
            const linksContainerId = `scrapbox-links-${encodeURIComponent(title.substring(0, 10))}-${Math.random().toString(36).substring(2, 7)}`;
            let linksContainer = item.querySelector<HTMLElement>(
              `.scrapbox-links-container`,
            );

            if (linksContainer) {
              linksContainer.remove();
            }

            linksContainer = document.createElement("div");
            linksContainer.id = linksContainerId;
            linksContainer.className = "scrapbox-links-container"; // New class name

            // Try to insert after the circle name, then after title, then fallback
            const circleElement =
              item.querySelector<HTMLElement>("p.basket-circle");
            const titleElement =
              item.querySelector<HTMLElement>("b.basket-name");
            const parentOfCircleOrTitle =
              item.querySelector<HTMLElement>(".basket-txtContent");

            if (circleElement && circleElement.parentNode) {
              circleElement.parentNode.insertBefore(
                linksContainer,
                circleElement.nextSibling,
              );
            } else if (titleElement && titleElement.parentNode) {
              titleElement.parentNode.insertBefore(
                linksContainer,
                titleElement.nextSibling,
              );
            } else if (parentOfCircleOrTitle) {
              parentOfCircleOrTitle.appendChild(linksContainer); // Fallback to end of basket-txtContent
            } else {
              item
                .querySelector<HTMLElement>(".basket-descCol")
                ?.appendChild(linksContainer); // Absolute fallback
            }

            const root = createRoot(linksContainer);
            const existPages = toCartScrapboxLinks(searchResult.pages);

            root.render(<CartScrapboxLinksDisplay existPages={existPages} />);
          } else {
            console.log(`[DMM Basket Checker] Not found in Scrapbox: ${title}`);
          }
        } catch (error) {
          console.error(
            "[DMM Basket Checker] Error searching Scrapbox:",
            error,
          );
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!projectName) return;

    const processedItems = new WeakSet<HTMLElement>();

    const handleMutations = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const elementNode = node as HTMLElement;
              // 追加されたノード自体がカートアイテムの場合
              if (
                elementNode.matches &&
                elementNode.matches("li.basket-listItem")
              ) {
                processCartItem(elementNode, projectName, processedItems);
              }
              // 追加されたノードの子孫にカートアイテムが含まれる場合
              elementNode
                .querySelectorAll<HTMLElement>("li.basket-listItem")
                .forEach((item) => {
                  processCartItem(item, projectName, processedItems);
                });
            }
          });
        }
      }
    };

    let observer: MutationObserver | null = null;

    const setupObserver = (targetNode: HTMLElement) => {
      observer = new MutationObserver(handleMutations);
      observer.observe(targetNode, { childList: true, subtree: true });
      // 初期表示時のアイテムも処理
      const initialItems =
        document.querySelectorAll<HTMLElement>("li.basket-listItem");
      initialItems.forEach((item) =>
        processCartItem(item, projectName, processedItems),
      );
    };

    const pollForBasketList = (retries = 10, interval = 500) => {
      const targetNode = document.querySelector<HTMLElement>("ul.basket-list");
      if (targetNode) {
        console.log(
          "[DMM Basket Checker] Target node 'ul.basket-list' found. Setting up MutationObserver.",
        );
        setupObserver(targetNode);
      } else if (retries > 0) {
        console.log(
          `[DMM Basket Checker] 'ul.basket-list' not found. Retrying in ${interval}ms... (${retries} retries left)`,
        );
        setTimeout(() => pollForBasketList(retries - 1, interval), interval);
      } else {
        console.error(
          "[DMM Basket Checker] Target node 'ul.basket-list' not found after multiple retries. Observer not set up.",
        );
      }
    };

    pollForBasketList();

    return () => {
      if (observer) {
        observer.disconnect();
      }
      // Clean up any injected alert bars if the component unmounts or projectName changes
      document
        .querySelectorAll(".scrapbox-alert-container")
        .forEach((el) => el.remove());
    };
  }, [projectName, processCartItem]);

  return null;
};

// Content scriptのエントリーポイント
// 既に同名のIDを持つ要素がないか確認
if (!document.getElementById("dmm-basket-checker-root")) {
  const rootElement = document.createElement("div");
  rootElement.id = "dmm-basket-checker-root";
  document.body.appendChild(rootElement);
  const root = createRoot(rootElement);
  root.render(<DMMBasketChecker />);
} else {
  console.log("[DMM Basket Checker] Root element already exists.");
}
