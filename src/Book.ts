import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import Product, { ProductType } from "./Product";
import { pageLink, ScrapboxTemplateVars } from "./domain/scrapboxFormatter";

class Book extends Product {
  // 著者
  protected readonly _authors: string[];
  // 出版社
  protected readonly _publisher: string | null;
  // レーベル
  protected readonly _label: string | null;

  private constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publisher: string | null,
    label: string | null,
    publishedAt: Dayjs | null,
  ) {
    super(service, title, authors, url, publishedAt);
    this._publisher = publisher;
    this._label = label;
    this._publishedAt = publishedAt;
  }

  get productType(): ProductType {
    return "book";
  }

  public static make(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publisher: string | null,
    label: string | null,
    publishedAt: Dayjs | null,
  ): Book {
    return new Book(
      service,
      title,
      authors,
      url,
      publisher,
      label,
      publishedAt,
    );
  }

  defaultScrapboxFormat(): string {
    return `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[レーベル]]：{label}
[[出版社]]: {publisher}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
  }

  protected toTemplateVars(): ScrapboxTemplateVars {
    return {
      ...super.toTemplateVars(),
      publisher: pageLink(this._publisher),
      label: pageLink(this._label),
    };
  }
}

export default Book;
