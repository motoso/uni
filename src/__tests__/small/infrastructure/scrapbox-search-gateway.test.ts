import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { searchScrapbox } from "../../../infrastructure/scrapboxSearchGateway";

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("標準fetchでCookieを含めてScrapboxを検索する", async () => {
  const searchResult = {
    count: 0,
    searchQuery: "検索語",
    pages: [],
  };
  const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => searchResult,
  } as Response);

  await expect(searchScrapbox("my-project", "検索語")).resolves.toEqual(
    searchResult,
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "https://scrapbox.io/api/pages/my-project/search/query?skip=0&sort=updated&limit=30&q=%E6%A4%9C%E7%B4%A2%E8%AA%9E",
    { credentials: "include" },
  );
});

test("Scrapboxが非2xxを返した場合は失敗にする", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: false,
    status: 503,
  } as Response);

  await expect(searchScrapbox("my-project", "検索語")).rejects.toThrow(
    "Scrapbox search failed: 503",
  );
});
