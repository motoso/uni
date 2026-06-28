import Product, { ProductType } from "./Product";
import { AcceptedService } from "./constant";
import { Dayjs } from "dayjs";

export default class DLsiteProduct extends Product {
  constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null = null,
  ) {
    super(service, title, authors, url, publishedAt);
  }

  get productType(): ProductType {
    // Using 'doujinshi' as a generic fallback type for now,
    // as requested by the user in a previous similar case (DMMBasket).
    // This could be a new specific type like "dlsite_cart_item" if preferred.
    return "doujinshi";
  }

  defaultScrapboxFormat(): string {
    return `[{title}] [{authors}] {service} {url} {publishedYear}年{publishedMonth}月{publishedDate}日`;
  }
}
