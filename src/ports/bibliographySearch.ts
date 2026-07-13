export type ProjectNameReader = () => Promise<string>;

export type BibliographySearchResult = {
  count: number;
  searchQuery: string;
  pages: Array<{
    image: string;
    title: string;
    lines: string[];
  }>;
};

export type BibliographySearchGateway = (
  projectName: string,
  query: string,
) => Promise<BibliographySearchResult>;

export type BibliographySearchDependencies = {
  getProjectName: ProjectNameReader;
  search: BibliographySearchGateway;
};
