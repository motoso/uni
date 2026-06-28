import { test, expect, describe, beforeEach, jest } from "@jest/globals";
import browser from "webextension-polyfill";
import { readScrapboxFormats } from "../../../settings/scrapboxFormatSettings";
import { StorageKeyScrapboxFormats } from "../../../chromeApi";

describe("readScrapboxFormats", () => {
  beforeEach(() => {
    // @ts-ignore
    browser.storage.sync.get.mockReset();
  });

  test("returns the stored scrapboxFormats map", async () => {
    const stored = { book: "format-book", film: "format-film" };
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      [StorageKeyScrapboxFormats]: stored,
    });

    const formats = await readScrapboxFormats();

    expect(formats).toEqual(stored);
    expect(browser.storage.sync.get).toHaveBeenCalledWith([
      StorageKeyScrapboxFormats,
    ]);
  });

  test("returns an empty object when nothing is stored", async () => {
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({});

    const formats = await readScrapboxFormats();

    expect(formats).toEqual({});
  });
});
