import type {
  BibliographySearchDependencies,
  BibliographySearchResult,
} from "../ports/bibliographySearch";
import { scrapboxPageUrl } from "../scrapbox/scrapboxPageUrl";
import {
  MessageErrorDto,
  SearchBibliographyRequestDto,
  SearchBibliographyResponseDto,
  SearchResultDto,
} from "../scrapbox/searchDtos";

export async function searchBibliography(
  request: Partial<SearchBibliographyRequestDto>,
  dependencies: BibliographySearchDependencies,
): Promise<SearchBibliographyResponseDto> {
  try {
    if (!request.query) {
      throw new Error("Missing Scrapbox search query");
    }

    const projectName = await dependencies.getProjectName();
    const response = await dependencies.search(projectName, request.query);

    return {
      status: "ok",
      projectName,
      searchResult: toSearchResultDto(response, projectName),
    };
  } catch (error) {
    return {
      status: "error",
      error: toMessageError(error),
    };
  }
}

function toSearchResultDto(
  response: BibliographySearchResult,
  projectName: string,
): SearchResultDto {
  return {
    count: response.count,
    projectName,
    searchQuery: response.searchQuery,
    pages: response.pages.map((page) => ({
      title: page.title,
      imageUrl: page.image,
      description: page.lines.join("\n"),
      pageUrl: scrapboxPageUrl(projectName, page.title),
    })),
  };
}

function toMessageError(error: unknown): MessageErrorDto {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}
