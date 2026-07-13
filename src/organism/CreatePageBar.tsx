import * as React from "preact/compat";
import Product from "../Product";
import { scrapboxPageUrl } from "../scrapbox/scrapboxPageUrl";
import { readScrapboxFormats } from "../settings/scrapboxFormatSettings";

type CreatePageBarProps = {
  product: Product;
  projectName: string;
};

export const createScrapboxPageUrl = async (
  projectName: string,
  product: Product,
): Promise<string> => {
  const formats = await readScrapboxFormats();
  const body = product.createScrapboxBodyString(formats);
  return `${scrapboxPageUrl(projectName, product.title)}?body=${encodeURIComponent(
    body,
  )}`;
};
export const CreatePageBar = (props: CreatePageBarProps) => {
  const { product, projectName } = props;

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = await createScrapboxPageUrl(projectName, product);
    window.open(url, "_blank");
  };

  return (
    <div className="bar createPage">
      <div className="message">未購入</div>
      <div className="link">
        <a href="#" onClick={handleClick}>
          {product.title} のページを作る
        </a>
      </div>
    </div>
  );
};
