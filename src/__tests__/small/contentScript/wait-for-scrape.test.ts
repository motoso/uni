import { describe, expect, test } from "@jest/globals";
import { parseHTML } from "linkedom";
import {
  waitForElement,
  waitForScrape,
} from "../../../contentScript/dom/waitForScrape";

// jsdom は parse5 の ESM/CJS 境界で jest が読めないため、
// scraper-fixtures テストと同様に linkedom で DOM を組み立てる。
function makeDom(): Document {
  const { document } = parseHTML("<!DOCTYPE html><html><body></body></html>");
  return document as unknown as Document;
}

describe("waitForScrape", () => {
  test("scrapeが即座に非nullを返す場合は即解決する", async () => {
    const document = makeDom();
    let calls = 0;

    const result = await waitForScrape(
      () => {
        calls += 1;
        return "ready";
      },
      { root: document.body },
    );

    expect(result).toBe("ready");
    // 即時成功なのでMutationObserverを待つ追加呼び出しは発生しない
    expect(calls).toBe(1);
  });

  test("初回nullでもDOM変化後にscrapeが成功すれば解決する", async () => {
    const document = makeDom();

    const promise = waitForScrape(
      () => document.querySelector("h1")?.textContent ?? null,
      { root: document.body, timeoutMs: 1000 },
    );

    // DOMがまだないので未解決。後からh1を追加する
    const h1 = document.createElement("h1");
    h1.textContent = "タイトル";
    document.body.appendChild(h1);

    const result = await promise;
    expect(result).toBe("タイトル");
  });

  test("timeoutMsを超えてもscrapeが成功しなければnullで解決する", async () => {
    const document = makeDom();

    const result = await waitForScrape(() => null, {
      root: document.body,
      timeoutMs: 30,
    });

    expect(result).toBeNull();
  });

  test("timeout後はobserverが解除され、その後のDOM変化で再scrapeしない", async () => {
    const document = makeDom();
    let calls = 0;

    const result = await waitForScrape(
      () => {
        calls += 1;
        return null;
      },
      { root: document.body, timeoutMs: 20 },
    );
    expect(result).toBeNull();

    const callsAtTimeout = calls;
    // 解除されていれば、この変化では scrape は呼ばれない
    document.body.appendChild(document.createElement("div"));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calls).toBe(callsAtTimeout);
  });
});

describe("waitForElement", () => {
  test("既に存在する要素は即座に返す", async () => {
    const document = makeDom();
    const existing = document.createElement("div");
    existing.id = "target";
    document.body.appendChild(existing);

    const result = await waitForElement("#target", { root: document.body });

    expect(result).toBe(existing);
  });

  test("後から追加された要素を待って返す", async () => {
    const document = makeDom();

    const promise = waitForElement("#late", {
      root: document.body,
      timeoutMs: 1000,
    });

    const late = document.createElement("div");
    late.id = "late";
    document.body.appendChild(late);

    const result = await promise;
    expect(result).toBe(late);
  });

  test("見つからなければtimeout後にnullを返す", async () => {
    const document = makeDom();

    const result = await waitForElement("#missing", {
      root: document.body,
      timeoutMs: 30,
    });

    expect(result).toBeNull();
  });
});
