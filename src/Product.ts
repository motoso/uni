import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import browser from "webextension-polyfill";
import { StorageKeyScrapboxFormats } from "./chromeApi";
import {
  formatScrapboxBody,
  pageLinks,
  ScrapboxTemplateVars,
} from "./domain/scrapboxFormatter";
import { titleForSearch } from "./domain/titleForSearch";

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
    // タイトルは全部半角にする
    this._title = title.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0),
    );
    this._authors = authors;
    this._url = url;
    this._publishedAt = publishedAt;
  }

  abstract get productType(): ProductType;

  /**
   * Scrapboxにページを作る際の本文
   */
  async createScrapboxBodyString(): Promise<string> {
    const result = await browser.storage.sync.get([StorageKeyScrapboxFormats]);
    const formats = (result.scrapboxFormats as Record<string, string>) || {};
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
