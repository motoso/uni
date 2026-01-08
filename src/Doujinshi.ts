import Product, { ProductType } from "./Product";
import { AcceptedService } from "./constant";
import { Dayjs } from "dayjs";

/**
 * 同人誌
 */
class Doujinshi extends Product {
  // サークル名
  protected _circleName: string | null;
  // イベント名
  protected _eventName: string | null;

  private constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs,
    circleName: string,
    eventName: string | null,
  ) {
    super(service, title, authors, url, publishedAt);
    this._circleName = circleName;
    this._eventName = eventName;
  }

  get productType(): ProductType {
    return "doujinshi";
  }

  public static make(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null,
    circleName: string,
    eventName: string | null,
  ): Doujinshi {
    return new Doujinshi(
      service,
      title,
      authors,
      url,
      publishedAt,
      circleName,
      eventName,
    );
  }
  defaultScrapboxFormat(): string {
    return `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[サークル名]]：{circleName}
[[イベント]]: {eventName}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
  }

  public static makeFromListenerRequest(req: any): Doujinshi {
    return Doujinshi.make(
      req._service,
      req._title,
      req._authors,
      req._url,
      req._publishedAt,
      req._circleName,
      req._eventName,
    );
  }

  protected replacePlaceholders(format: string): string {
    let result = super.replacePlaceholders(format);
    result = result.replace(
      /\{circleName\}/g,
      this._circleName ? `[${this._circleName}]` : "",
    );
    result = result.replace(
      /\{eventName\}/g,
      this._eventName ? `[${this._eventName}]` : "",
    );
    return result;
  }
}

export default Doujinshi;
