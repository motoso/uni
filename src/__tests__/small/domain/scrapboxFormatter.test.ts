import { describe, expect, test } from "@jest/globals";
import {
  formatScrapboxBody,
  pageLink,
  pageLinks,
} from "../../../domain/scrapboxFormatter";

describe("scrapboxFormatter", () => {
  test("replaces repeated placeholders", () => {
    expect(
      formatScrapboxBody("{title} / {title}", { title: "テストタイトル" }),
    ).toBe("テストタイトル / テストタイトル");
  });

  test("leaves unknown placeholders unchanged", () => {
    expect(
      formatScrapboxBody("{title} {unknown}", { title: "テストタイトル" }),
    ).toBe("テストタイトル {unknown}");
  });

  test("uses empty string values as replacements", () => {
    expect(formatScrapboxBody("イベント:{eventName}", { eventName: "" })).toBe(
      "イベント:",
    );
  });

  test("pageLink wraps present values and omits nullish values", () => {
    expect(pageLink("作者")).toBe("[作者]");
    expect(pageLink(null)).toBe("");
    expect(pageLink(undefined)).toBe("");
  });

  test("pageLinks wraps each value and omits nullish lists", () => {
    expect(pageLinks(["作者A", "作者B"])).toBe("[作者A] [作者B]");
    expect(pageLinks([])).toBe("");
    expect(pageLinks(null)).toBe("");
    expect(pageLinks(undefined)).toBe("");
  });
});
