import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import browser from "webextension-polyfill";
import { StorageKeyScrapboxFormats } from "./chromeApi";

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
    publishedAt: Dayjs,
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
    return format
      .replace(/\{title\}/g, this._title)
      .replace(
        /\{authors\}/g,
        this._authors.map((author) => `[${author}]`).join(" "),
      )
      .replace(/\{service\}/g, this._service)
      .replace(/\{url\}/g, this._url)
      .replace(
        /\{publishedYear\}/g,
        this._publishedAt ? this._publishedAt.year().toString() : "",
      )
      .replace(
        /\{publishedMonth\}/g,
        this._publishedAt ? (this._publishedAt.month() + 1).toString() : "",
      )
      .replace(
        /\{publishedDate\}/g,
        this._publishedAt?.date().toString() || "",
      );
  }

  abstract defaultScrapboxFormat(): string;

  get title(): string {
    return this._title;
  }
  get titleForSearch(): string {
    return (
      this._title
        // 全角英数は全て半角にする。記号もなるべく半角にする
        // MEMO: 。、はこのように半角にすることはできない
        .replace(/[Ａ-Ｚａ-ｚ０-９（）！？，＃]/g, (s) =>
          String.fromCharCode(s.charCodeAt(0) - 0xfee0),
        )
        // 数字のカッコは最初に外す
        .replace(/\((\d+)\)/g, " $1 ")
        // 行頭のカッコはラベルとみなして消す (非貪欲)
        .replace(/^\([^)]*\)/, "")
        // 末尾のカッコはラベルとみなして消す (非貪欲)
        .replace(/\([^)]*\)$/, "")
        // 一度トリムして、後続の処理でスペースに変換される可能性のある括弧が端にある場合に備える
        .trim()
        // 末尾のハートは除去（FANZA Booksである）
        .replace(/▼$/, "")
        // 【コミック版】みたいな情報は除去
        // ただし【推しの子】は除外
        .replace(/【(?!推しの子).*?】/g, "")
        // - はScrapboxのAPIでは除外扱いになるので除去する
        // ただしact-ageがactageになるのは困るのでスペースに変換する
        .replace(/-/g, " ")
        // 全角伸ばし棒もスペースに変換
        .replace(/[―—]/g, " ")
        // 中間のかっこは空白にする (行頭・行末処理後)
        .replace(/[()]/g, " ")
        // exclamation markは半角スペースにする
        // 行頭行末がスペースになっても最後にtrimするので大丈夫
        .replace(/[!]/g, " ")
        // 中黒はスペースに変換する
        .replace(/・/g, " ")
        // 伏字の●はスペースに変換する
        .replace(/●/g, " ")
        // 〜はスペースに変換する
        .replace(/[～〜~]/g, " ")
        // ?や#はスペースに変換する
        .replace(/[?#]/g, " ")
        // ○はスペースに変換する
        .replace(/[○◯]/g, " ")
        // 読点はスペースに変換する
        .replace(/[,]/g, " ")
        // 文末文頭を置換したときに空白が出るのを防止
        .trim()
        // スペースが複数含まれる場合がある。スペースの数は無視する
        .split(/\s+/)
        // 検索区切りは最大4つまで
        .slice(0, 4)
        .join(" ")
    );
  }
}

export default Product;
