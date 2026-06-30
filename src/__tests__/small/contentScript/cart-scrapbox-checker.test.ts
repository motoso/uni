import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { parseHTML } from "linkedom";
import browser from "webextension-polyfill";
import { mountCartScrapboxChecker } from "../../../contentScript/CartScrapboxChecker";
import { AcceptedService } from "../../../constant";
import Doujinshi from "../../../Doujinshi";
import { SearchBibliographyAction } from "../../../scrapbox/searchDtos";

const waitForEffects = async (ms = 20) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const waitUntil = async (predicate: () => boolean) => {
  for (let i = 0; i < 10; i += 1) {
    if (predicate()) {
      return;
    }
    await waitForEffects(20);
  }
};

const sendMessageMock = () => {
  return browser.runtime.sendMessage as jest.MockedFunction<
    (message?: unknown) => Promise<unknown>
  >;
};

describe("CartScrapboxChecker", () => {
  let originalDocument: unknown;
  let originalWindow: unknown;
  let originalNode: unknown;
  let originalMutationObserver: unknown;
  let originalChrome: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    originalDocument = (globalThis as { document?: Document }).document;
    originalWindow = (globalThis as { window?: Window }).window;
    originalNode = (globalThis as { Node?: typeof Node }).Node;
    originalMutationObserver = (
      globalThis as { MutationObserver?: typeof MutationObserver }
    ).MutationObserver;
    originalChrome = (globalThis as { chrome?: unknown }).chrome;

    sendMessageMock().mockResolvedValue({
      status: "ok",
      projectName: "proj",
      searchResult: {
        count: 1,
        pages: [
          {
            title: "既存ページ",
            pageUrl: "https://scrapbox.io/proj/%E6%97%A2%E5%AD%98",
          },
        ],
      },
    });

    (globalThis as { chrome?: unknown }).chrome = {
      storage: {
        sync: {
          get: jest.fn((_keys, callback: (result: unknown) => void) => {
            callback({ projectName: "proj" });
          }),
        },
      },
    };
  });

  afterEach(() => {
    (globalThis as { document?: unknown }).document = originalDocument;
    (globalThis as { window?: unknown }).window = originalWindow;
    (globalThis as { Node?: unknown }).Node = originalNode;
    (globalThis as { MutationObserver?: unknown }).MutationObserver =
      originalMutationObserver;
    (globalThis as { chrome?: unknown }).chrome = originalChrome;
    jest.restoreAllMocks();
  });

  const setGlobalDom = (html: string) => {
    const { document, window } = parseHTML(html);
    (globalThis as { document?: Document }).document =
      document as unknown as Document;
    (globalThis as { window?: Window }).window = window as unknown as Window;
    (globalThis as { Node?: typeof Node }).Node = window.Node;
    (
      globalThis as { MutationObserver?: typeof MutationObserver }
    ).MutationObserver = window.MutationObserver;
    return document;
  };

  const mountChecker = () => {
    mountCartScrapboxChecker("cart-checker-root", {
      logPrefix: "[Cart Test]",
      missingProjectNameMessage: "[Cart Test] missing project",
      observerTargetSelector: "ul.cart",
      observerTargetDescription: "ul.cart",
      itemSelector: "li.item",
      createProduct: (item) => {
        const titleAnchor = item.querySelector<HTMLAnchorElement>("a.title");
        const title = titleAnchor?.textContent?.trim();
        if (!title) {
          return null;
        }

        return Doujinshi.make(
          AcceptedService.dmmDoujinBasket,
          title,
          [],
          titleAnchor?.href || window.location.href,
          null,
          "circle",
          null,
        );
      },
      insertLinksContainer: (item, linksContainer) => {
        item.querySelector(".links-anchor")?.appendChild(linksContainer);
      },
    });
  };

  test("初期表示のcart itemを検索し、指定位置へScrapboxリンクを描画する", async () => {
    const document = setGlobalDom(
      '<!DOCTYPE html><html><body><ul class="cart"><li class="item"><a class="title" href="https://example.com/item">タイトル(1)</a><div class="links-anchor"></div></li></ul></body></html>',
    );

    mountChecker();
    await waitUntil(() => sendMessageMock().mock.calls.length > 0);
    await waitUntil(() => {
      const linksContainer = document.querySelector(
        ".scrapbox-links-container",
      );
      return (
        linksContainer?.textContent?.includes("もう買ってるかも:") ?? false
      );
    });

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: SearchBibliographyAction,
      query: "タイトル 1",
    });
    const linksContainer = document.querySelector(".scrapbox-links-container");
    expect(linksContainer?.parentElement?.className).toBe("links-anchor");
    expect(linksContainer?.textContent).toContain("もう買ってるかも:");
    expect(
      linksContainer?.querySelector<HTMLAnchorElement>("a")?.href,
    ).toContain("https://scrapbox.io/proj/");
  });

  test("後から追加されたcart itemをMutationObserver経由で検索する", async () => {
    const document = setGlobalDom(
      '<!DOCTYPE html><html><body><ul class="cart"></ul></body></html>',
    );

    mountChecker();
    await waitForEffects(50);
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();

    const item = document.createElement("li");
    item.className = "item";
    item.innerHTML =
      '<a class="title" href="https://example.com/new">追加タイトル</a><div class="links-anchor"></div>';
    document.querySelector("ul.cart")?.appendChild(item);
    await waitUntil(() => sendMessageMock().mock.calls.length > 0);

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: SearchBibliographyAction,
      query: "追加タイトル",
    });
    expect(item.querySelector(".scrapbox-links-container")).not.toBeNull();
  });
});
