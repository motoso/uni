import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import type {
  BibliographySearchGateway,
  BibliographySearchResult,
} from "../../../ports/bibliographySearch";
import { searchBibliography } from "../../../usecase/searchBibliography";
import {
  SearchBibliographyAction,
  SearchBibliographyResponseDto,
} from "../../../scrapbox/searchDtos";

const makeSearchResponse = (count: number): BibliographySearchResult => {
  return {
    count,
    pages:
      count > 0
        ? [
            {
              image: "https://example.com/image.jpg",
              title: "既存ページ",
              lines: ["line 1", "line 2"],
            },
          ]
        : [],
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
    .fn<BibliographySearchGateway>()
    .mockResolvedValue(makeSearchResponse(1));

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
      search: jest
        .fn<BibliographySearchGateway>()
        .mockResolvedValue(makeSearchResponse(0)),
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
  const search = jest.fn<BibliographySearchGateway>();

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
        .fn<BibliographySearchGateway>()
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

test("project nameの読込が失敗した場合は検索せずerrorを返す", async () => {
  const search = jest.fn<BibliographySearchGateway>();

  const response = await searchBibliography(
    { action: SearchBibliographyAction, query: "検索語" },
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockRejectedValue(new Error("Storage unavailable")),
      search,
    },
  );

  expect(search).not.toHaveBeenCalled();
  expect(response).toEqual({
    status: "error",
    error: {
      message: "Storage unavailable",
      name: "Error",
    },
  });
});

test("Error以外の例外もmessage DTOへ変換する", async () => {
  const response = await searchBibliography(
    { action: SearchBibliographyAction, query: "検索語" },
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search: jest
        .fn<BibliographySearchGateway>()
        .mockRejectedValue("unknown failure"),
    },
  );

  expect(response).toEqual({
    status: "error",
    error: {
      message: "unknown failure",
    },
  });
});
