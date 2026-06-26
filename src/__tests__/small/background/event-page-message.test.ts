import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { UniPostMessage } from "../../../chromeApi";
import { UniCommand } from "../../../constant";
import { GetPagesSearchResponseInterface } from "../../../scrapbox/SearchResult";
import { handleBibliographySearchMessage } from "../../../eventPage";

type SearchFn = (
  projectName: string,
  query: string,
) => Promise<GetPagesSearchResponseInterface>;

const makeRawSearchResponse = (
  count: number,
): GetPagesSearchResponseInterface => {
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
  const postMessage = jest.fn<(message: UniPostMessage) => void>();
  const search = jest
    .fn<SearchFn>()
    .mockResolvedValue(makeRawSearchResponse(1));

  await handleBibliographySearchMessage(
    { command: UniCommand.sendBibliography, query: "検索語" },
    postMessage,
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search,
    },
  );

  expect(search).toHaveBeenCalledWith("my-project", "検索語");
  expect(postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      command: UniCommand.existsPage,
      searchResult: expect.objectContaining({
        count: 1,
        projectName: "my-project",
        searchQuery: "検索語",
      }),
    }),
  );
});

test("検索結果がない場合はcreatePageを返す", async () => {
  const postMessage = jest.fn<(message: UniPostMessage) => void>();

  await handleBibliographySearchMessage(
    { command: UniCommand.sendBibliography, query: "検索語" },
    postMessage,
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search: jest
        .fn<SearchFn>()
        .mockResolvedValue(makeRawSearchResponse(0)),
    },
  );

  expect(postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      command: UniCommand.createPage,
      searchResult: expect.objectContaining({
        count: 0,
        projectName: "my-project",
        searchQuery: "検索語",
      }),
    }),
  );
});

test("queryがない場合はsearchErrorを返して検索しない", async () => {
  const postMessage = jest.fn<(message: UniPostMessage) => void>();
  const getProjectName = jest.fn<() => Promise<string>>();
  const search = jest.fn<SearchFn>();

  await handleBibliographySearchMessage(
    { command: UniCommand.sendBibliography },
    postMessage,
    { getProjectName, search },
  );

  expect(getProjectName).not.toHaveBeenCalled();
  expect(search).not.toHaveBeenCalled();
  expect(postMessage).toHaveBeenCalledWith({
    command: UniCommand.searchError,
    error: {
      message: "Missing Scrapbox search query",
      name: "Error",
    },
  });
});

test("検索が失敗した場合はsearchErrorを返す", async () => {
  const postMessage = jest.fn<(message: UniPostMessage) => void>();

  await handleBibliographySearchMessage(
    { command: UniCommand.sendBibliography, query: "検索語" },
    postMessage,
    {
      getProjectName: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("my-project"),
      search: jest
        .fn<SearchFn>()
        .mockRejectedValue(new Error("Scrapbox unavailable")),
    },
  );

  expect(postMessage).toHaveBeenCalledWith({
    command: UniCommand.searchError,
    error: {
      message: "Scrapbox unavailable",
      name: "Error",
    },
  });
});
