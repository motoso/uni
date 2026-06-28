import Product, { ProductType } from "./Product";
import { AcceptedService } from "./constant";
import { Dayjs } from "dayjs";
import { pageLink, ScrapboxTemplateVars } from "./domain/scrapboxFormatter";

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
    publishedAt: Dayjs | null,
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

  protected toTemplateVars(): ScrapboxTemplateVars {
    return {
      ...super.toTemplateVars(),
      circleName: pageLink(this._circleName),
      eventName: pageLink(this._eventName),
    };
  }
}

export default Doujinshi;
