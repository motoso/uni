import Product, { ProductType } from "./Product";
import { Dayjs } from "dayjs";
import { AcceptedService } from "./constant";
import { pageLink, ScrapboxTemplateVars } from "./domain/scrapboxFormatter";

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
    publishedAt: Dayjs | null,
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
    publishedAt: Dayjs | null,
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
[[監督]]： {director}
[[レーベル]]：{label}
[[ID]]：{id}
[[発行年]]：[{publishedYear}]/{publishedMonth}/{publishedDate}
`;
  }

  protected toTemplateVars(): ScrapboxTemplateVars {
    return {
      ...super.toTemplateVars(),
      director: pageLink(this._director),
      id: this._id || "",
      label: pageLink(this._label),
    };
  }
}

export default Film;
