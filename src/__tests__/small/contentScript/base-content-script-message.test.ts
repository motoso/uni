import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import browser from "webextension-polyfill";
import { BaseContentScript } from "../../../contentScript/BaseContentScript";
import { AcceptedService, UniCommand } from "../../../constant";
import Doujinshi from "../../../Doujinshi";
import Product from "../../../Product";

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
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("検索時はProductではなくtitleForSearchのqueryだけを送る", () => {
  new TestContentScript(makeProduct("タイトル(1)")).execute();

  expect(browser.runtime.connect).toHaveBeenCalledWith({
    name: AcceptedService.fanza,
  });

  const port = (browser.runtime.connect as jest.Mock).mock.results[0]
    .value as any;
  expect(port.postMessage).toHaveBeenCalledWith({
    command: UniCommand.sendBibliography,
    query: "タイトル 1",
  });
});

test("scrapeできない場合はbackgroundへ接続しない", () => {
  new TestContentScript(null).execute();

  expect(browser.runtime.connect).not.toHaveBeenCalled();
});

test("検索エラーを受け取った場合はバーを描画せずに切断する", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  const script = new TestContentScript(makeProduct("タイトル"));
  script.execute();

  const port = (browser.runtime.connect as jest.Mock).mock.results[0]
    .value as any;
  const listener = port.onMessage.addListener.mock.calls[0][0];

  await listener({
    command: UniCommand.searchError,
    error: { message: "Scrapbox unavailable", name: "Error" },
  });

  expect(script.createdBars).toBe(0);
  expect(port.disconnect).toHaveBeenCalledTimes(1);
});
