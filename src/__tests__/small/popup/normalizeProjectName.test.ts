import { test, expect } from "@jest/globals";
import { normalizeProjectName } from "../../../popup/normalizeProjectName";

test("プロジェクト名のみ_変更なし", () => {
  expect(normalizeProjectName("project-name")).toBe("project-name");
});

test("プロジェクト名_末尾スラッシュ削除", () => {
  expect(normalizeProjectName("project-name/")).toBe("project-name");
});

test("完全なURL_httpsプロトコル付き", () => {
  expect(normalizeProjectName("https://scrapbox.io/project-name")).toBe("project-name");
});

test("完全なURL_httpsプロトコル付き_末尾スラッシュあり", () => {
  expect(normalizeProjectName("https://scrapbox.io/project-name/")).toBe("project-name");
});

test("URL_ページパス含む場合はプロジェクト名のみ抽出", () => {
  expect(normalizeProjectName("https://scrapbox.io/project-name/some-page")).toBe("project-name");
});

test("URL_クエリパラメータ含む", () => {
  expect(normalizeProjectName("https://scrapbox.io/project-name?foo=bar")).toBe("project-name");
});

test("前後の空白削除", () => {
  expect(normalizeProjectName("  project-name  ")).toBe("project-name");
});

test("空文字列", () => {
  expect(normalizeProjectName("")).toBe("");
});
