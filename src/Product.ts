import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import {
  formatScrapboxBody,
  pageLinks,
  ScrapboxFormats,
  ScrapboxTemplateVars,
} from "./domain/scrapboxFormatter";
import { titleForSearch } from "./domain/titleForSearch";
import { toHalfWidth } from "./domain/halfWidth";

export type ProductType = "book" | "doujinshi" | "film" | "asmr";

/**
 * 商品一般
 */
abstract class Product {
  protected _service: AcceptedService;
  // タイトル
  protected _title: string;
  // 著者名
  protected _authors: string[];
  // 見ることができるURL
  protected _url: string;
  // 発行日
  protected _publishedAt: Dayjs | null;

  protected constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null,
  ) {
    this._service = service;
    // タイトルの全角英数字は半角にする
    this._title = toHalfWidth(title, /[Ａ-Ｚａ-ｚ０-９]/g);
    this._authors = authors;
    this._url = url;
    this._publishedAt = publishedAt;
  }

  abstract get productType(): ProductType;

  /**
   * Scrapboxにページを作る際の本文。
   * フォーマットは呼び出し側で storage から読み込んで渡す（browser API 非依存）。
   */
  createScrapboxBodyString(formats: ScrapboxFormats): string {
    const format = formats[this.productType] || this.defaultScrapboxFormat();
    return this.replacePlaceholders(format);
  }

  protected replacePlaceholders(format: string): string {
    return formatScrapboxBody(format, this.toTemplateVars());
  }

  protected toTemplateVars(): ScrapboxTemplateVars {
    return {
      title: this._title,
      authors: pageLinks(this._authors),
      service: this._service,
      url: this._url,
      publishedYear: this._publishedAt
        ? this._publishedAt.year().toString()
        : "",
      publishedMonth: this._publishedAt
        ? (this._publishedAt.month() + 1).toString()
        : "",
      publishedDate: this._publishedAt?.date().toString() || "",
    };
  }

  abstract defaultScrapboxFormat(): string;

  get title(): string {
    return this._title;
  }
  get titleForSearch(): string {
    return titleForSearch(this._title);
  }
}

export default Product;
