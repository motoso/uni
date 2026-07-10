import Product, { ProductType } from "../Product";
import { AcceptedService } from "../constant";

export type ProductSiteDefinition<TScrapedData> = Readonly<{
  id: string;
  service: AcceptedService;
  hosts: readonly string[];
  matches: readonly string[];
  productTypes: readonly ProductType[];
  contentScriptEntry: string;
  scraper: (document: Document) => TScrapedData | null;
  createProduct: (scrapedData: TScrapedData) => Product;
}>;

export function defineProductSite<TScrapedData>(
  definition: ProductSiteDefinition<TScrapedData>,
): ProductSiteDefinition<TScrapedData> {
  return definition;
}
