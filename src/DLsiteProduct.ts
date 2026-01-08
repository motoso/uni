import Product, { ProductType } from "./Product";
import { AcceptedService } from "./constant";
import { Dayjs } from "dayjs"; // Import Dayjs

export default class DLsiteProduct extends Product {
  constructor(
    service: AcceptedService,
    title: string,
    authors: string[],
    url: string,
    publishedAt: Dayjs | null = null, // Make publishedAt optional and allow null
  ) {
    // Pass null for publishedAt if not provided, Product constructor handles null
    super(service, title, authors, url, publishedAt as Dayjs);
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
