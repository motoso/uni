import { beforeEach, expect, jest, test } from "@jest/globals";
import browser from "webextension-polyfill";
import { BaseContentScript } from "../../../contentScript/BaseContentScript";
import { AcceptedService, UniCommand } from "../../../constant";
import Doujinshi from "../../../Doujinshi";
import Product from "../../../Product";

class TestContentScript extends BaseContentScript {
  protected readonly SERVICE = AcceptedService.fanza;

  constructor(private readonly product: Product | null) {
    super();
  }

  protected scrape(): Product | null {
    return this.product;
  }

  protected createElementForBar(): void {
    return;
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
