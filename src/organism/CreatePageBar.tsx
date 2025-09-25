import ScrapboxApiClient from "../scrapbox/scrapboxApi";
import * as React from "react";
import Product from "../Product";

type CreatePageBarProps = {
  product: Product;
  projectName: string;
};

export const createScrapboxPageUrl = async (
  projectName: string,
  product: Product,
): Promise<string> => {
  const body = await product.createScrapboxBodyString();
  return `${ScrapboxApiClient.BASE_URL}/${projectName}/${encodeURIComponent(
    product.title,
  )}?body=${encodeURIComponent(body)}`;
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
