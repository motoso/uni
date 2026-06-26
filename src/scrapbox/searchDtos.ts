export const SearchBibliographyAction = "searchBibliography" as const;

export type MessageErrorDto = {
  message: string;
  name?: string;
};

export type ScrapboxSearchApiPageDto = {
  image: string;
  title: string;
  lines: string[];
  created: number;
  updated: number;
};

export type ScrapboxSearchApiResponseDto = {
  count: number;
  existsExactTitleMatch: boolean;
  limit: number;
  pages: ScrapboxSearchApiPageDto[];
  projectName: string;
  query: { words: string[]; excludes: string[] };
  searchQuery: string;
};

export type ScrapboxPageDto = {
  title: string;
  imageUrl: string;
  description: string;
  pageUrl: string;
};

export type SearchResultDto = {
  count: number;
  projectName: string;
  searchQuery: string;
  pages: ScrapboxPageDto[];
};

export type SearchBibliographyRequestDto = {
  action: typeof SearchBibliographyAction;
  query: string;
};

export type SearchBibliographyResponseDto =
  | {
      status: "ok";
      projectName: string;
      searchResult: SearchResultDto;
    }
  | {
      status: "error";
      error: MessageErrorDto;
    };
