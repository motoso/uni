// Listen to messages sent from other parts of the extension.
import browser from "webextension-polyfill";
import { readProjectName } from "./infrastructure/projectNameReader";
import { searchScrapbox } from "./infrastructure/scrapboxSearchGateway";
import type { BibliographySearchDependencies } from "./ports/bibliographySearch";
import {
  SearchBibliographyAction,
  SearchBibliographyRequestDto,
  SearchBibliographyResponseDto,
} from "./scrapbox/searchDtos";
import { searchBibliography } from "./usecase/searchBibliography";

export async function handleBibliographySearchMessage(
  request: Partial<SearchBibliographyRequestDto>,
  dependencies: BibliographySearchDependencies = {
    getProjectName: readProjectName,
    search: searchScrapbox,
  },
): Promise<SearchBibliographyResponseDto> {
  return searchBibliography(request, dependencies);
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

function isSearchBibliographyRequest(
  request: unknown,
): request is SearchBibliographyRequestDto {
  return (
    typeof request === "object" &&
    request !== null &&
    (request as { action?: unknown }).action === SearchBibliographyAction
  );
}
