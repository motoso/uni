// Listen to messages sent from other parts of the extension.
import Book from "./Book";
import { isBook, isVideo, UniCommand, UniPort } from "./constant";
import { uniPostMessage, UniPostMessage } from "./chromeApi";
import ScrapboxApiClient from "./scrapbox/scrapboxApi"; // For BASE_URL, can be refactored later
import Page from "./scrapbox/Page"; // Import Page
import SearchResult, {
  GetPagesSearchResponseInterface,
} from "./scrapbox/SearchResult"; // Import SearchResult and interface
import Doujinshi from "./Doujinshi";
import Film from "./Film";
import ky from "ky"; // Import ky
import browser from "webextension-polyfill";

// Reads all data out of storage.sync and exposes it via a promise.
async function getAllStorageSyncData(): Promise<{ [key: string]: any }> {
  return await browser.storage.sync.get(null);
}

// Where we will expose all the data we retrieve from storage.sync.
const storageCache = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData().then((items) => {
  // Copy the data retrieved from storage into storageCache.
  Object.assign(storageCache, items);
});
const getProjectName = (): string => {
  return storageCache["projectName"] ?? "";
};

browser.runtime.onConnect.addListener((port: UniPort) => {
  port.onMessage.addListener(async (msg: UniPostMessage) => {
    try {
      await initStorageCache;
    } catch (e) {
      // Handle error that occurred during storage initialization.
    }

    if (msg.command === UniCommand.sendBibliography && msg.product) {
      // addlistenerで受け取ったrequestは型情報が失われているので型をつける
      // @ts-ignore
      const service = msg.product._service;
      let product;
      if (isBook(service)) {
        product = Book.makeFromListenerRequest(msg.product);
      } else if (isVideo(service)) {
        product = Film.makeFromListenerRequest(msg.product);
      } else {
        product = Doujinshi.makeFromListenerRequest(msg.product);
      }

      // Directly use performActualScrapboxSearch and reconstruct SearchResult
      try {
        const currentProjectName = getProjectName();
        const rawRes: GetPagesSearchResponseInterface =
          await performActualScrapboxSearch(
            currentProjectName,
            product.titleForSearch,
          );

        const pages = rawRes.pages.map((pageData) => {
          return Page.make(
            pageData.title,
            pageData.image,
            pageData.lines.join("\n"),
            currentProjectName,
          );
        });
        const searchResult = SearchResult.make(
          rawRes.count,
          rawRes.projectName, // This should be currentProjectName or rawRes.projectName if available and reliable
          rawRes.searchQuery,
          pages,
        );

        console.log(
          "[eventPage] Search successful (via onConnect):",
          searchResult,
        );
        if (searchResult.count >= 1) {
          uniPostMessage(port, {
            command: UniCommand.existsPage,
            searchResult: searchResult,
          });
        } else {
          uniPostMessage(port, {
            command: UniCommand.createPage,
            searchResult: searchResult,
          });
        }
      } catch (error) {
        console.error(
          "[eventPage] Error during search (via onConnect):",
          error,
        );
        // Optionally send an error message back via the port if the UniPostMessage protocol supports it
        // For now, just logging, as the original code didn't have explicit error sending here.
      }
    }
  });
});

// 拡張のボタンのpopupを有効にする条件のルール (Chrome only)
let rule: any = null;
if (browser.declarativeContent) {
  rule = {
    conditions: [
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: {
          hostEquals: "book.dmm.co.jp",
          pathContains: "detail/",
          schemes: ["https"],
        },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: "www.dlsite.com", schemes: ["https"] },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: "toranoana.jp", schemes: ["https"] },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: "melonbooks.co.jp", schemes: ["https"] },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: "bookwalker.jp", schemes: ["https"] },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: "www.amazon.co.jp", schemes: ["https"] },
      }),
      new browser.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: "www.suruga-ya.jp", schemes: ["https"] },
      }),
    ],
    actions: [new browser.declarativeContent.ShowAction()],
  };
}

// Added rules are saved across browser restarts, so register them as follows
// https://developer.chrome.com/extensions/declarativeContent
// Note: declarativeContent is only available in Chrome
browser.runtime.onInstalled.addListener((details) => {
  if (browser.declarativeContent && rule) {
    browser.declarativeContent.onPageChanged.removeRules(undefined, () => {
      browser.declarativeContent.onPageChanged.addRules([rule]);
    });
  }
});

// Function to perform the actual Scrapbox search using ky
async function performActualScrapboxSearch(
  projectName: string,
  query: string,
): Promise<any> {
  // Consider defining a stricter return type if GetPagesSearchResponseInterface is accessible
  const params = new URLSearchParams({
    skip: "0",
    sort: "updated",
    limit: "30", // Default limit
    q: query,
  });
  const searchUrl = `${ScrapboxApiClient.BASE_URL}/api/pages/${projectName}/search/query?${params}`;
  console.log("[eventPage] Performing direct search on Scrapbox:", searchUrl);
  return ky.get(searchUrl, { credentials: "include" }).json();
}

// Listener for search requests from content scripts
browser.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
  if (request.action === "searchScrapbox") {
    const { projectName, query } = request;
    performActualScrapboxSearch(projectName, query)
      .then((data) => {
        console.log("[eventPage] Search successful (via onMessage):", data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error(
          "[eventPage] Error searching Scrapbox (via onMessage):",
          error,
        );
        sendResponse({
          success: false,
          error: { message: error.message, name: error.name },
        });
      });
    return true; // Indicates that the response is sent asynchronously
  }
  // Ensure other potential messages are handled or this listener is specific enough
  // If this listener ONLY handles 'searchScrapbox', then it's fine.
  // Otherwise, ensure 'return true' is only called if a response will be sent asynchronously.
});
