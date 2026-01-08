import * as React from "react";
import { createRoot } from "react-dom/client";
import ScrapboxApiClient from "../scrapbox/scrapboxApi";
import DLsiteProduct from "../DLsiteProduct"; // Changed import
import { AcceptedService } from "../constant";
import { createScrapboxPageUrl } from "../organism/CreatePageBar";
import { StorageKeyProjectName } from "../chromeApi";
import Page from "../scrapbox/Page";

type ScrapboxLinksDisplayProps = {
  existPages: { name: string; url: string }[];
  product: DLsiteProduct;
  projectName: string;
};

const ScrapboxLinksDisplay: React.FC<ScrapboxLinksDisplayProps> = ({
  existPages,
  product,
  projectName,
}) => {
  const pageCreationUrl = createScrapboxPageUrl(projectName, product);

  return (
    <div
      style={{
        marginTop: "8px",
        fontSize: "12px",
        padding: "5px",
        border: "1px solid #ffcdd2",
        backgroundColor: "#ffebee",
      }}
    >
      <strong style={{ color: "#c62828" }}>もう買ってるかも:</strong>
      {existPages.map((page) => (
        <a
          key={page.url}
          href={page.url}
          target="_blank"
          style={{
            marginLeft: "8px",
            color: "#007bff",
            textDecoration: "underline",
          }}
        >
          {page.name}
        </a>
      ))}
      {/* <br />
      <a href={pageCreationUrl} target="_blank" style={{ marginTop: '4px', display: 'inline-block', color: '#28a745', textDecoration: 'underline' }}>
        「{product.title}」のページを作成
      </a> */}
    </div>
  );
};

const DLsiteCartChecker = () => {
  const [projectName, setProjectName] = React.useState<string | null>(null);

  React.useEffect(() => {
    chrome.storage.sync.get([StorageKeyProjectName], (result) => {
      const storedProjectName = result[StorageKeyProjectName];
      if (typeof storedProjectName === "string" && storedProjectName.trim()) {
        setProjectName(storedProjectName);
      } else {
        console.warn(
          "[DLsite Cart Checker] Scrapbox project name is not set. Please set it in the extension options.",
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
        item.querySelector<HTMLAnchorElement>(".work_name > a");
      const title = titleAnchor?.innerText.trim();
      const itemUrl = titleAnchor?.href;
      const makerName = item
        .querySelector<HTMLAnchorElement>(".maker_name > a")
        ?.innerText.trim();

      if (title) {
        console.log(`[DLsite Cart Checker] Checking: ${title}`);
        const apiClient = new ScrapboxApiClient();
        try {
          const product = new DLsiteProduct(
            AcceptedService.dlsite,
            title,
            makerName ? [makerName] : [],
            itemUrl || window.location.href,
          );

          const searchResult = await apiClient.search({
            product,
            projectName: currentProjectName,
          });
          console.log(
            `[DLsite Cart Checker] searchResult for "${title}":`,
            searchResult,
          );

          if (
            searchResult &&
            searchResult.count > 0 &&
            searchResult.pages &&
            searchResult.pages.length > 0
          ) {
            console.log(
              `[DLsite Cart Checker] Found in Scrapbox: ${title}. Count: ${searchResult.count}, Pages:`,
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
            linksContainer.className = "scrapbox-links-container";

            const workContentElement =
              item.querySelector<HTMLElement>(".work_content");
            if (workContentElement) {
              workContentElement.appendChild(linksContainer);
            } else {
              // Fallback if .work_content is not found
              item.appendChild(linksContainer);
            }

            const root = createRoot(linksContainer);
            const existPages = searchResult.pages.map((p: Page) => ({
              name: p.title,
              url: p.pageUrl,
            }));

            root.render(
              <ScrapboxLinksDisplay
                existPages={existPages}
                product={product}
                projectName={currentProjectName}
              />,
            );
          } else {
            console.log(
              `[DLsite Cart Checker] Not found in Scrapbox: ${title}`,
            );
          }
        } catch (error) {
          console.error(
            "[DLsite Cart Checker] Error searching Scrapbox:",
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
              if (
                elementNode.matches &&
                elementNode.matches("li.cart_list_item")
              ) {
                processCartItem(elementNode, projectName, processedItems);
              }
              elementNode
                .querySelectorAll<HTMLElement>("li.cart_list_item")
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
      const initialItems = document.querySelectorAll<HTMLElement>(
        "div#cart_wrapper li.cart_list_item._cart_items", // More specific selector for initial items
      );
      initialItems.forEach((item) => {
        // Ensure we don't process items that are marked as removed (display:none)
        if (item.offsetParent !== null) {
          // Check if the element is visible
          processCartItem(item, projectName, processedItems);
        }
      });
    };

    const pollForCartList = (retries = 10, interval = 500) => {
      const targetNode = document.querySelector<HTMLElement>(
        ".payment_cart_list ul.cart_list",
      );
      if (targetNode) {
        console.log(
          "[DLsite Cart Checker] Target node '.payment_cart_list ul.cart_list' found. Setting up MutationObserver.",
        );
        setupObserver(targetNode);
      } else if (retries > 0) {
        console.log(
          `[DLsite Cart Checker] '.payment_cart_list ul.cart_list' not found. Retrying in ${interval}ms... (${retries} retries left)`,
        );
        setTimeout(() => pollForCartList(retries - 1, interval), interval);
      } else {
        console.error(
          "[DLsite Cart Checker] Target node '.payment_cart_list ul.cart_list' not found after multiple retries. Observer not set up.",
        );
      }
    };

    pollForCartList();

    return () => {
      if (observer) {
        observer.disconnect();
      }
      document
        .querySelectorAll(".scrapbox-links-container")
        .forEach((el) => el.remove());
    };
  }, [projectName, processCartItem]);

  return null;
};

if (!document.getElementById("dlsite-cart-checker-root")) {
  const rootElement = document.createElement("div");
  rootElement.id = "dlsite-cart-checker-root";
  document.body.appendChild(rootElement);
  const root = createRoot(rootElement);
  root.render(<DLsiteCartChecker />);
} else {
  console.log("[DLsite Cart Checker] Root element already exists.");
}
