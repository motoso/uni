/**
 * Scrapboxのページ
 */
import ScrapboxApiClient from "./scrapboxApi"; // BASE_URL を使うためにインポート

class Page {
  // ページタイトル（URLのパス）
  private readonly _title: string;
  // サムネイルURL
  private readonly _imageUrl: string;
  // 内容（5行？）
  private readonly _description: string;
  // Scrapboxページへの完全なURL
  private readonly _pageUrl: string;

  constructor(title: string, imageUrl: string, description: string, projectName: string) {
    this._title = title;
    this._imageUrl = imageUrl;
    this._description = description;
    this._pageUrl = `${ScrapboxApiClient.BASE_URL}/${projectName}/${encodeURIComponent(title)}`;
  }

  public static make(
    title: string,
    imageUrl: string,
    description: string,
    projectName: string
  ): Page {
    return new Page(title, imageUrl, description, projectName);
  }

  /**
   * addlistenerで受け取ったrequestは型情報が失われているので頑張って型をつける
   * このメソッドはprojectNameを必要とするため、呼び出し側での対応が必要。
   * もしこのメソッドがクライアントサイド(ストレージからprojectNameを取得できる側)でのみ呼ばれるなら問題ないが、
   * そうでない場合は、別途projectNameを渡す方法を検討する必要がある。
   * 今回のDMMBasketの件では直接使用されないため、一旦据え置くが、リファクタリングの余地あり。
   */
  public static makeFromListenerRequest(req: any, projectName: string): Page {
    // projectNameがない場合のフォールバックやエラー処理を検討すべき
    return this.make(req._title, req._imageUrl, req._description, projectName);
  }

  get title(): string {
    return this._title;
  }

  get imageUrl(): string {
    return this._imageUrl;
  }

  get description(): string {
    return this._description;
  }

  get pageUrl(): string {
    return this._pageUrl;
  }
}

export default Page;
