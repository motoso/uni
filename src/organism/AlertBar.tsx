import * as React from "react";
import Product from "../Product";
import { createScrapboxPageUrl } from "./CreatePageBar";

type AlertBarProps = {
  existPages: { name: string; url: string }[];
  product: Product;
  projectName: string;
};
/**
 * 画面上部に出る警告バー
 * @param props
 * @constructor
 */
export function AlertBar(props: AlertBarProps) {
  const { existPages, product, projectName } = props;

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = await createScrapboxPageUrl(projectName, product);
    window.open(url, "_blank");
  };

  return (
    <div className="bar alert">
      <div className="message">もう買ってるかも</div>
      <div className="link">
        {/* TODO: ボタンにする?*/}
        {existPages.map((page) => (
          <a href={page.url} key={page.url} target="_blank">
            {page.name}
          </a>
        ))}
      </div>
      <div className="link">
        <a href="#" onClick={handleClick}>
          {product.title} のページを作る
        </a>
      </div>
    </div>
  );
}
