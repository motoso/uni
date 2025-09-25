import Product, { ProductType } from "./Product";
import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";

/**
 * 映画
 */
class Film extends Product {
  protected _director: string | null;
  protected _label: string;
  protected _id: string;

  private constructor(
    service: AcceptedService,
    title: string,
    actors: string[],
    director: string | null,
    url: string,
    publishedAt: Dayjs,
    label: string | null,
    id: string | null,
  ) {
    super(service, title, actors, url, publishedAt);
    this._director = director;
    this._label = label;
    this._id = id;
  }

  get productType(): ProductType {
    return "film";
  }

  public static make(
    service: AcceptedService,
    title: string,
    actors: string[],
    director: string | null,
    url: string,
    publishedAt: Dayjs,
    label: string | null,
    id: string | null,
  ): Film {
    return new Film(
      service,
      title,
      actors,
      director,
      url,
      publishedAt,
      label,
      id,
    );
  }

  defaultScrapboxFormat(): string {
    return `[{service}で視聴 {url}]
[[出演者]]：{authors}
[[概要]]：
[[監督]]： ${this._director ? `[${this._director}]` : ""}
[[レーベル]]：[${this._label}]
[[ID]]：${this._id}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
  }

  public static makeFromListenerRequest(request: any): Film {
    return Film.make(
      request._service,
      request._title,
      request._actors,
      request._director,
      request._url,
      request._publishedAt,
      request._label,
      request._id,
    );
  }

  protected replacePlaceholders(format: string): string {
    let result = super.replacePlaceholders(format); // 基本的な置換を親クラスに任せる
    result = result
      .replace(/\{director\}/g, this._director ? `[${this._director}]` : "")
      .replace(/\{id\}/g, this._id || "") // this._id が null の場合も考慮
      .replace(/\{label\}/g, this._label ? `[${this._label}]` : "");
    return result;
  }
}

export default Film;
