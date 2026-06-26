// Listen to messages sent from other parts of the extension.
import { UniCommand, UniPort } from "./constant";
import {
  StorageKeyProjectName,
  uniPostMessage,
  UniPostMessage,
} from "./chromeApi";
import ScrapboxApiClient from "./scrapbox/scrapboxApi"; // For BASE_URL, can be refactored later
import Page from "./scrapbox/Page"; // Import Page
import SearchResult, {
  GetPagesSearchResponseInterface,
} from "./scrapbox/SearchResult"; // Import SearchResult and interface
import ky from "ky"; // Import ky
import browser from "webextension-polyfill";

const getProjectName = async (): Promise<string> => {
  const items = await browser.storage.sync.get([StorageKeyProjectName]);
  return (items[StorageKeyProjectName] as string) ?? "";
};

type SearchDependencies = {
  getProjectName: () => Promise<string>;
  search: (
    projectName: string,
    query: string,
  ) => Promise<GetPagesSearchResponseInterface>;
};

export async function handleBibliographySearchMessage(
  msg: UniPostMessage,
  postMessage: (message: UniPostMessage) => void,
  dependencies: SearchDependencies = {
    getProjectName,
    search: performActualScrapboxSearch,
  },
): Promise<void> {
  if (msg.command !== UniCommand.sendBibliography) {
    return;
  }

  try {
    if (!msg.query) {
      throw new Error("Missing Scrapbox search query");
    }

    const currentProjectName = await dependencies.getProjectName();
    const rawRes = await dependencies.search(currentProjectName, msg.query);

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

    console.log("[eventPage] Search successful (via onConnect):", searchResult);
    if (searchResult.count >= 1) {
      postMessage({
        command: UniCommand.existsPage,
        searchResult: searchResult,
      });
    } else {
      postMessage({
        command: UniCommand.createPage,
        searchResult: searchResult,
      });
    }
  } catch (error) {
    console.error("[eventPage] Error during search (via onConnect):", error);
    postMessage({
      command: UniCommand.searchError,
      error: toMessageError(error),
    });
  }
}

browser.runtime.onConnect.addListener((port: UniPort) => {
  port.onMessage.addListener(async (msg: UniPostMessage) => {
    await handleBibliographySearchMessage(msg, (message) => {
      uniPostMessage(port, message);
    });
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
): Promise<GetPagesSearchResponseInterface> {
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

function toMessageError(error: unknown): { message: string; name?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
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
