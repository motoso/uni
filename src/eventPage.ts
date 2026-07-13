// Listen to messages sent from other parts of the extension.
import { StorageKeyProjectName } from "./chromeApi";
import ky from "ky";
import browser from "webextension-polyfill";
import { SCRAPBOX_BASE_URL } from "./scrapbox/constants";
import { scrapboxPageUrl } from "./scrapbox/scrapboxPageUrl";
import {
  MessageErrorDto,
  ScrapboxSearchApiResponseDto,
  SearchBibliographyAction,
  SearchBibliographyRequestDto,
  SearchBibliographyResponseDto,
  SearchResultDto,
} from "./scrapbox/searchDtos";

const getProjectName = async (): Promise<string> => {
  const items = await browser.storage.sync.get([StorageKeyProjectName]);
  return (items[StorageKeyProjectName] as string) ?? "";
};

type SearchDependencies = {
  getProjectName: () => Promise<string>;
  search: (
    projectName: string,
    query: string,
  ) => Promise<ScrapboxSearchApiResponseDto>;
};

export async function handleBibliographySearchMessage(
  request: Partial<SearchBibliographyRequestDto>,
  dependencies: SearchDependencies = {
    getProjectName,
    search: performActualScrapboxSearch,
  },
): Promise<SearchBibliographyResponseDto> {
  try {
    if (!request.query) {
      throw new Error("Missing Scrapbox search query");
    }

    const currentProjectName = await dependencies.getProjectName();
    const rawRes = await dependencies.search(currentProjectName, request.query);
    const searchResult = toSearchResultDto(rawRes, currentProjectName);

    console.log("[eventPage] Search successful:", searchResult);
    return {
      status: "ok",
      projectName: currentProjectName,
      searchResult,
    };
  } catch (error) {
    console.error("[eventPage] Error during search:", error);
    return {
      status: "error",
      error: toMessageError(error),
    };
  }
}

export function registerBackgroundListeners(): void {
  browser.runtime.onMessage.addListener((request) => {
    if (isSearchBibliographyRequest(request)) {
      return handleBibliographySearchMessage(request);
    }

    return undefined;
  });

  // 拡張のボタンのpopupを有効にする条件のルール (Chrome only)
  const rule = browser.declarativeContent
    ? {
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
      }
    : null;

  // Added rules are saved across browser restarts, so register them as follows
  // https://developer.chrome.com/extensions/declarativeContent
  // Note: declarativeContent is only available in Chrome
  browser.runtime.onInstalled.addListener(() => {
    if (browser.declarativeContent && rule) {
      browser.declarativeContent.onPageChanged.removeRules(undefined, () => {
        browser.declarativeContent.onPageChanged.addRules([rule]);
      });
    }
  });
}

// Function to perform the actual Scrapbox search using ky
async function performActualScrapboxSearch(
  projectName: string,
  query: string,
): Promise<ScrapboxSearchApiResponseDto> {
  const params = new URLSearchParams({
    skip: "0",
    sort: "updated",
    limit: "30", // Default limit
    q: query,
  });
  const searchUrl = `${SCRAPBOX_BASE_URL}/api/pages/${projectName}/search/query?${params}`;
  console.log("[eventPage] Performing direct search on Scrapbox:", searchUrl);
  return ky.get(searchUrl, { credentials: "include" }).json();
}

function isSearchBibliographyRequest(
  request: unknown,
): request is SearchBibliographyRequestDto {
  return (
    typeof request === "object" &&
    request !== null &&
    (request as { action?: unknown }).action === SearchBibliographyAction
  );
}

function toSearchResultDto(
  rawRes: ScrapboxSearchApiResponseDto,
  projectName: string,
): SearchResultDto {
  return {
    count: rawRes.count,
    projectName,
    searchQuery: rawRes.searchQuery,
    pages: rawRes.pages.map((pageData) => ({
      title: pageData.title,
      imageUrl: pageData.image,
      description: pageData.lines.join("\n"),
      pageUrl: scrapboxPageUrl(projectName, pageData.title),
    })),
  };
}

function toMessageError(error: unknown): MessageErrorDto {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}
