import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { searchBibliography } from "../../../usecase/searchBibliography";
import {
  ScrapboxSearchApiResponseDto,
  SearchBibliographyAction,
  SearchBibliographyResponseDto,
} from "../../../scrapbox/searchDtos";

type SearchFn = (
  projectName: string,
  query: string,
) => Promise<ScrapboxSearchApiResponseDto>;

const makeRawSearchResponse = (count: number): ScrapboxSearchApiResponseDto => {
  return {
    count,
    existsExactTitleMatch: count > 0,
    limit: 30,
    pages:
      count > 0
        ? [
            {
              image: "https://example.com/image.jpg",
              title: "既存ページ",
              lines: ["line 1", "line 2"],
              created: 1,
              updated: 2,
            },
          ]
        : [],
    projectName: "my-project",
    query: { words: ["検索語"], excludes: [] },
    searchQuery: "検索語",
  };
};

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("検索結果がある場合はexistsPageを返す", async () => {
  const search = jest
    .fn<SearchFn>()
    .mockResolvedValue(makeRawSearchResponse(1));

  const response = await searchBibliography(
    { action: SearchBibliographyAction, query: "検索語" },
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search,
    },
  );

  expect(search).toHaveBeenCalledWith("my-project", "検索語");
  const expected: SearchBibliographyResponseDto = {
    status: "ok",
    projectName: "my-project",
    searchResult: {
      count: 1,
      projectName: "my-project",
      searchQuery: "検索語",
      pages: [
        {
          title: "既存ページ",
          imageUrl: "https://example.com/image.jpg",
          description: "line 1\nline 2",
          pageUrl:
            "https://scrapbox.io/my-project/%E6%97%A2%E5%AD%98%E3%83%9A%E3%83%BC%E3%82%B8",
        },
      ],
    },
  };
  expect(response).toEqual(expected);
});

test("検索結果がない場合はcreatePageを返す", async () => {
  const response = await searchBibliography(
    { action: SearchBibliographyAction, query: "検索語" },
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search: jest.fn<SearchFn>().mockResolvedValue(makeRawSearchResponse(0)),
    },
  );

  expect(response).toEqual({
    status: "ok",
    projectName: "my-project",
    searchResult: {
      count: 0,
      projectName: "my-project",
      searchQuery: "検索語",
      pages: [],
    },
  });
});

test("queryがない場合はsearchErrorを返して検索しない", async () => {
  const getProjectName = jest.fn<() => Promise<string>>();
  const search = jest.fn<SearchFn>();

  const response = await searchBibliography(
    { action: SearchBibliographyAction },
    { getProjectName, search },
  );

  expect(getProjectName).not.toHaveBeenCalled();
  expect(search).not.toHaveBeenCalled();
  expect(response).toEqual({
    status: "error",
    error: {
      message: "Missing Scrapbox search query",
      name: "Error",
    },
  });
});

test("検索が失敗した場合はsearchErrorを返す", async () => {
  const response = await searchBibliography(
    { action: SearchBibliographyAction, query: "検索語" },
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search: jest
        .fn<SearchFn>()
        .mockRejectedValue(new Error("Scrapbox unavailable")),
    },
  );

  expect(response).toEqual({
    status: "error",
    error: {
      message: "Scrapbox unavailable",
      name: "Error",
    },
  });
});
