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
import { BaseContentScript } from "../../../contentScript/BaseContentScript";
import { DetailContentScript } from "../../../contentScript/DetailContentScript";
import { AcceptedService } from "../../../constant";
import Doujinshi from "../../../Doujinshi";
import Product from "../../../Product";
import { SearchBibliographyAction } from "../../../scrapbox/searchDtos";

class TestContentScript extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanza;
  public createdBars = 0;

  constructor(private readonly product: Product | null) {
    super();
  }

  protected scrape(): Product | null {
    return this.product;
  }

  protected createElementForBar(): void {
    this.createdBars += 1;
  }
}

class MountTestContentScript extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanza;

  protected scrape(): Product | null {
    return null;
  }

  protected createElementForBar(): void {
    // root element mount helper の単体検証用
  }

  public mountAppend(target: Element): HTMLDivElement {
    return this.mountRootElement(target);
  }

  public mountAfterEnd(target: Element): HTMLDivElement {
    return this.mountRootElement(target, "afterend");
  }

  public mountAtBodyStart(): HTMLDivElement {
    return this.mountRootElementAtBodyStart();
  }
}

class DeclarativeMountTestContentScript extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanza;
  protected readonly rootElementMountPoint = {
    target: "#header",
    position: "afterend" as const,
  };

  protected scrape(): Product | null {
    return null;
  }

  public mountFromConfig(): void {
    this.createElementForBar();
  }
}

class DetailTestContentScript extends DetailContentScript<{ title: string }> {
  protected readonly SERVICE = AcceptedService.fanza;
  protected readonly rootElementMountPoint = { target: "body" };

  constructor(private readonly scrapedData: { title: string } | null) {
    super();
  }

  protected scrapeData(): { title: string } | null {
    return this.scrapedData;
  }

  protected createProduct(scrapedData: { title: string }): Product {
    return makeProduct(scrapedData.title);
  }
}

const makeProduct = (title: string): Product => {
  return Doujinshi.make(
    AcceptedService.fanza,
    title,
    ["author"],
    "https://example.com",
    null,
    "circle",
    null,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  const sendMessage = browser.runtime.sendMessage as jest.MockedFunction<
    (message?: unknown) => Promise<unknown>
  >;
  sendMessage.mockReturnValue(new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("検索時はProductではなくtitleForSearchのqueryだけを送る", () => {
  new TestContentScript(makeProduct("タイトル(1)")).execute();

  expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
    action: SearchBibliographyAction,
    query: "タイトル 1",
  });
  expect(browser.runtime.connect).not.toHaveBeenCalled();
});

test("scrapeできない場合はbackgroundへ接続しない", () => {
  new TestContentScript(null).execute();

  expect(browser.runtime.connect).not.toHaveBeenCalled();
  expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
});

test("検索エラーを受け取った場合はバーを描画しない", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  const sendMessage = browser.runtime.sendMessage as jest.MockedFunction<
    (message?: unknown) => Promise<unknown>
  >;
  const response = {
    status: "error",
    error: { message: "Scrapbox unavailable", name: "Error" },
  } as const;
  sendMessage.mockResolvedValue(response);
  const script = new TestContentScript(makeProduct("タイトル"));
  script.execute();

  await Promise.resolve();

  expect(script.createdBars).toBe(0);
});

test("DetailContentScriptはscraped dataからProductを作って検索する", () => {
  new DetailTestContentScript({ title: "詳細ページ(2)" }).execute();

  expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
    action: SearchBibliographyAction,
    query: "詳細ページ 2",
  });
});

describe("root element mounting", () => {
  let originalDocument: unknown;

  beforeEach(() => {
    originalDocument = (globalThis as { document?: Document }).document;
  });

  afterEach(() => {
    (globalThis as { document?: unknown }).document = originalDocument;
  });

  const setGlobalDocument = (document: Document) => {
    (globalThis as { document?: Document }).document = document;
  };

  test("指定した要素の末尾にuni bar rootを追加する", () => {
    const { document } = parseHTML(
      '<!DOCTYPE html><html><body><header id="header"></header></body></html>',
    );
    setGlobalDocument(document as unknown as Document);

    const header = document.getElementById("header");
    const root = new MountTestContentScript().mountAppend(header);

    expect(root.id).toBe("uniBarRoot");
    expect(header.lastElementChild).toBe(root);
  });

  test("指定した要素の直後にuni bar rootを追加する", () => {
    const { document } = parseHTML(
      '<!DOCTYPE html><html><body><header id="header"></header><main></main></body></html>',
    );
    setGlobalDocument(document as unknown as Document);

    const header = document.getElementById("header");
    const root = new MountTestContentScript().mountAfterEnd(header);

    expect(root.id).toBe("uniBarRoot");
    expect(header.nextElementSibling).toBe(root);
  });

  test("bodyの先頭にuni bar rootを追加する", () => {
    const { document } = parseHTML(
      '<!DOCTYPE html><html><body><main id="first"></main></body></html>',
    );
    setGlobalDocument(document as unknown as Document);

    const root = new MountTestContentScript().mountAtBodyStart();

    expect(root.id).toBe("uniBarRoot");
    expect(document.body.firstElementChild).toBe(root);
  });

  test("rootElementMountPointの設定でuni bar rootを追加する", () => {
    const { document } = parseHTML(
      '<!DOCTYPE html><html><body><header id="header"></header><main></main></body></html>',
    );
    setGlobalDocument(document as unknown as Document);

    new DeclarativeMountTestContentScript().mountFromConfig();

    const header = document.getElementById("header");
    expect(header.nextElementSibling?.id).toBe("uniBarRoot");
  });
});

describe("動的描画サイト (waitForDynamicContent)", () => {
  let originalDocument: unknown;

  // BaseContentScript の動的待ちは default root = document.body を使うため、
  // linkedom の document を globalThis に差し込む。
  const setGlobalDocument = (document: Document) => {
    originalDocument = (globalThis as { document?: Document }).document;
    (globalThis as { document?: Document }).document = document;
  };

  afterEach(() => {
    (globalThis as { document?: unknown }).document = originalDocument;
  });

  class DynamicScript extends BaseContentScript {
    protected readonly SERVICE = AcceptedService.fanza;
    protected readonly waitForDynamicContent = true;
    protected readonly scrapeTimeoutMs = 50;

    constructor(private readonly doc: Document) {
      super();
    }

    protected scrape(): Product | null {
      return this.doc.querySelector("#ready") ? makeProduct("おそ作") : null;
    }

    protected createElementForBar(): void {
      // このテストでは描画前の sendMessage 呼び出しだけを検証する
    }
  }

  test("即時scrape失敗後、DOM変化でscrapeが成功したら検索する", async () => {
    const { document } = parseHTML(
      "<!DOCTYPE html><html><body></body></html>",
    );
    setGlobalDocument(document as unknown as Document);

    new DynamicScript(document as unknown as Document).execute();

    // まだ本文がないので検索していない
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();

    const ready = document.createElement("div");
    ready.id = "ready";
    document.body.appendChild(ready);

    // observer コールバック -> searchAndRender の sendMessage まで待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      action: SearchBibliographyAction,
      query: "おそ作",
    });
  });

  test("DOMが変化してもscrapeが成功しなければ検索しない", async () => {
    const { document } = parseHTML(
      "<!DOCTYPE html><html><body></body></html>",
    );
    setGlobalDocument(document as unknown as Document);

    new DynamicScript(document as unknown as Document).execute();

    // #ready ではない要素を追加しても scrape は失敗のまま
    document.body.appendChild(document.createElement("span"));
    // timeout を超えるまで待ち、observer/timer が後始末されることも確認する
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
