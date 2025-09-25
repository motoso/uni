import Page from "./Page";

export interface GetPagesSearchResponseInterface {
  count: number;
  existsExactTitleMatch: boolean;
  limit: number;
  // pagesは要素が多いので興味があるところしか型付けしていない
  pages: {
    image: string;
    title: string;
    lines: string[]; // max5行？ 本文がそのまま出るわけではない。
    created: number; // UNIXTIME
    updated: number; // UNIXTIME
  }[];
  projectName: string;
  query: { words: string[]; excludes: string[] };
  searchQuery: string;
}

/**
 * GET /api/pages/PROJ_NAME/search/query
 * Scrapboxのレスポンス
 * 確認日：2020-07-23
 */
export default class SearchResult {
  /**
   * 検索結果のエントリ数
   */
  private readonly _count: number;
  /**
   * 検索したプロジェクトの名前
   * e.g. https://scrapbox.io/[HERE]
   */
  private readonly _projectName: string;
  /**
   * 検索クエリ
   */
  private readonly _searchQuery: string;
  private readonly _pages: Page[];

  private constructor(
    count: number,
    projectName: string,
    searchQuery: string,
    pages: Page[]
  ) {
    this._count = count;
    this._projectName = projectName;
    this._searchQuery = searchQuery;
    this._pages = pages;
  }

  public static make(
    count: number,
    projectName: string,
    searchQuery: string,
    pages: Page[]
  ): SearchResult {
    return new SearchResult(count, projectName, searchQuery, pages);
  }

  /**
   * addlistenerで受け取ったrequestは型情報が失われているので頑張って型をつける
   */
  public static makeFromListenerRequest(req: any): SearchResult {
    const pages = req._pages.map((p) => Page.makeFromListenerRequest(p, req._projectName));
    return this.make(req._count, req._projectName, req._searchQuery, pages);
  }

  get count(): number {
    return this._count;
  }

  get projectName(): string {
    return this._projectName;
  }

  get searchQuery(): string {
    return this._searchQuery;
  }

  get pages(): Page[] {
    return this._pages;
  }
}
