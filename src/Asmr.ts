import Product, { ProductType } from "./Product";
import { AcceptedService } from "./constant";
import { Dayjs } from "dayjs";
import {
  pageLink,
  pageLinks,
  ScrapboxTemplateVars,
} from "./domain/scrapboxFormatter";

/**
 * 音声作品
 */
class Asmr extends Product {
  // サークル名
  protected _circleName: string | null;
  // イベント名
  protected _eventName: string | null;
  // イラストレーター
  private readonly _illustrators: string[] | null;
  // 声優
  private readonly _voiceActors: string[] | null;
  // シナリオライター
  private readonly _writers: string[] | null;

  private constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null,
    circleName: string,
    eventName: string | null,
    illustrators: string[] | null,
    voiceActors: string[] | null,
    writers: string[] | null,
  ) {
    super(service, title, authors, url, publishedAt);
    this._circleName = circleName;
    this._eventName = eventName;
    this._illustrators = illustrators;
    this._voiceActors = voiceActors;
    this._writers = writers;
  }

  get productType(): ProductType {
    return "asmr";
  }

  public static make(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null,
    circleName: string,
    eventName: string | null,
    illustrators: string[] | null,
    voiceActors: string[] | null,
    writers: string[] | null,
  ): Asmr {
    return new Asmr(
      service,
      title,
      authors,
      url,
      publishedAt,
      circleName,
      eventName,
      illustrators,
      voiceActors,
      writers,
    );
  }

  defaultScrapboxFormat(): string {
    const draft = `[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[サークル名]]：[${this._circleName}]
[[声優]]：${this._voiceActors ? this._voiceActors.map((o) => `[${o}]`).join(" ") : ""}
[[シナリオライター]]：${this._writers ? this._writers.map((o) => `[${o}]`).join(" ") : ""}
[[イラストレーター]]：${this._illustrators ? this._illustrators.map((o) => `[${o}]`).join(" ") : ""}
[[イベント]]: ${this._eventName ? `[${this._eventName}]` : ""}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
    return draft;
  }

  protected toTemplateVars(): ScrapboxTemplateVars {
    return {
      ...super.toTemplateVars(),
      circleName: pageLink(this._circleName),
      eventName: pageLink(this._eventName),
      illustrators: pageLinks(this._illustrators),
      voiceActors: pageLinks(this._voiceActors),
      writers: pageLinks(this._writers),
    };
  }
}

export default Asmr;
