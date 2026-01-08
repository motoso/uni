import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import Product, { ProductType } from "./Product";

class Book extends Product {
  // 著者
  protected readonly _authors: string[];
  // 出版社
  protected readonly _publisher: string | null;
  // レーベル
  protected readonly _label: string | null;

  // 要素を増やしたときには makeFromListenerRequest にパラメータを必ず追加してください

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

  public static makeFromListenerRequest(req: any): Book {
    return Book.make(
      req._service,
      req._title,
      req._authors,
      req._url,
      req._publisher,
      req._label,
      // TODO: ここ未検証。dayjsのオブジェクトがChromeにばらされたらどうなる？Dayjs()すればなおる？
      req._publishedAt,
    );
  }

  defaultScrapboxFormat(): string {
    return `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
${this._label ? `[[レーベル]]：[${this._label}]` : ""}${this._publisher ? `[[出版社]]: [${this._publisher}]` : ""}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
  }

  protected replacePlaceholders(format: string): string {
    let result = super.replacePlaceholders(format);
    result = result.replace(
      /\{publisher\}/g,
      this._publisher ? `[${this._publisher}]` : "",
    );
    result = result.replace(
      /\{label\}/g,
      this._label ? `[${this._label}]` : "",
    );
    return result;
  }
}

export default Book;
