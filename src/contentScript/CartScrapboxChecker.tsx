import * as React from "preact/compat";
import { createRoot } from "preact/compat/client";
import { StorageKeyProjectName } from "../chromeApi";
import Product from "../Product";
import ScrapboxApiClient from "../scrapbox/scrapboxApi";
import {
  CartScrapboxLinksDisplay,
  toCartScrapboxLinks,
} from "./cartScrapboxLinks";

const LinksContainerClassName = "scrapbox-links-container";

export type CartScrapboxCheckerConfig = {
  logPrefix: string;
  missingProjectNameMessage: string;
  observerTargetSelector: string;
  observerTargetDescription: string;
  itemSelector: string;
  initialItemSelector?: string;
  initialItemFilter?: (item: HTMLElement) => boolean;
  createProduct: (item: HTMLElement) => Product | null;
  insertLinksContainer: (
    item: HTMLElement,
    linksContainer: HTMLElement,
  ) => void;
  pollRetries?: number;
  pollIntervalMs?: number;
};

type CartScrapboxCheckerProps = {
  config: CartScrapboxCheckerConfig;
};

const createLinksContainerId = (title: string): string => {
  return `scrapbox-links-${encodeURIComponent(title.substring(0, 10))}-${Math.random().toString(36).substring(2, 7)}`;
};

const CartScrapboxChecker: React.FC<CartScrapboxCheckerProps> = ({
  config,
}) => {
  const [projectName, setProjectName] = React.useState<string | null>(null);

  React.useEffect(() => {
    chrome.storage.sync.get([StorageKeyProjectName], (result) => {
      const storedProjectName = result[StorageKeyProjectName];
      if (typeof storedProjectName === "string" && storedProjectName.trim()) {
        setProjectName(storedProjectName);
      } else {
        console.warn(config.missingProjectNameMessage);
      }
    });
  }, [config]);

  const processCartItem = React.useCallback(
    async (item: HTMLElement, processedItems: WeakSet<HTMLElement>) => {
      if (processedItems.has(item) || !projectName) {
        return;
      }
      processedItems.add(item);

      const product = config.createProduct(item);
      if (!product) {
        return;
      }

      console.log(`${config.logPrefix} Checking: ${product.title}`);
      const apiClient = new ScrapboxApiClient();
      try {
        const searchResult = await apiClient.search({ product });
        console.log(
          `${config.logPrefix} searchResult for "${product.title}":`,
          searchResult,
        );

        if (
          searchResult &&
          searchResult.count > 0 &&
          searchResult.pages &&
          searchResult.pages.length > 0
        ) {
          console.log(
            `${config.logPrefix} Found in Scrapbox: ${product.title}. Count: ${searchResult.count}, Pages:`,
            searchResult.pages,
          );
          const existingLinksContainer = item.querySelector<HTMLElement>(
            `.${LinksContainerClassName}`,
          );
          existingLinksContainer?.remove();

          const linksContainer = document.createElement("div");
          linksContainer.id = createLinksContainerId(product.title);
          linksContainer.className = LinksContainerClassName;
          config.insertLinksContainer(item, linksContainer);

          const root = createRoot(linksContainer);
          root.render(
            <CartScrapboxLinksDisplay
              existPages={toCartScrapboxLinks(searchResult.pages)}
            />,
          );
        } else {
          console.log(
            `${config.logPrefix} Not found in Scrapbox: ${product.title}`,
          );
        }
      } catch (error) {
        console.error(`${config.logPrefix} Error searching Scrapbox:`, error);
      }
    },
    [config, projectName],
  );

  React.useEffect(() => {
    if (!projectName) return;

    const processedItems = new WeakSet<HTMLElement>();

    const processMatchingItems = (elementNode: HTMLElement) => {
      if (elementNode.matches(config.itemSelector)) {
        void processCartItem(elementNode, processedItems);
      }
      elementNode
        .querySelectorAll<HTMLElement>(config.itemSelector)
        .forEach((item) => {
          void processCartItem(item, processedItems);
        });
    };

    const handleMutations = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processMatchingItems(node as HTMLElement);
            }
          });
        }
      }
    };

    let observer: MutationObserver | null = null;
    let cancelled = false;

    const setupObserver = (targetNode: HTMLElement) => {
      observer = new MutationObserver(handleMutations);
      observer.observe(targetNode, { childList: true, subtree: true });
      const initialItems = document.querySelectorAll<HTMLElement>(
        config.initialItemSelector ?? config.itemSelector,
      );
      initialItems.forEach((item) => {
        if (!config.initialItemFilter || config.initialItemFilter(item)) {
          void processCartItem(item, processedItems);
        }
      });
    };

    const pollForTarget = (
      retries = config.pollRetries ?? 10,
      interval = config.pollIntervalMs ?? 500,
    ) => {
      if (cancelled) return;

      const targetNode = document.querySelector<HTMLElement>(
        config.observerTargetSelector,
      );
      if (targetNode) {
        console.log(
          `${config.logPrefix} Target node '${config.observerTargetDescription}' found. Setting up MutationObserver.`,
        );
        setupObserver(targetNode);
      } else if (retries > 0) {
        console.log(
          `${config.logPrefix} '${config.observerTargetDescription}' not found. Retrying in ${interval}ms... (${retries} retries left)`,
        );
        setTimeout(() => pollForTarget(retries - 1, interval), interval);
      } else {
        console.error(
          `${config.logPrefix} Target node '${config.observerTargetDescription}' not found after multiple retries. Observer not set up.`,
        );
      }
    };

    pollForTarget();

    return () => {
      cancelled = true;
      observer?.disconnect();
      document
        .querySelectorAll(`.${LinksContainerClassName}`)
        .forEach((el) => el.remove());
    };
  }, [config, processCartItem, projectName]);

  return null;
};

export function mountCartScrapboxChecker(
  rootElementId: string,
  config: CartScrapboxCheckerConfig,
): void {
  if (!document.getElementById(rootElementId)) {
    const rootElement = document.createElement("div");
    rootElement.id = rootElementId;
    document.body.appendChild(rootElement);
    const root = createRoot(rootElement);
    root.render(<CartScrapboxChecker config={config} />);
  } else {
    console.log(`${config.logPrefix} Root element already exists.`);
  }
}
