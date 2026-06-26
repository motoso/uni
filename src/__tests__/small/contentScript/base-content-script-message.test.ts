import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import browser from "webextension-polyfill";
import { BaseContentScript } from "../../../contentScript/BaseContentScript";
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
