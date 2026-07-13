import * as React from "preact/compat";
import { ScrapboxPageDto } from "../scrapbox/searchDtos";

export type CartScrapboxLink = {
  name: string;
  url: string;
};

type CartScrapboxLinksDisplayProps = {
  existPages: CartScrapboxLink[];
};

export const CartScrapboxLinksDisplay: React.FC<
  CartScrapboxLinksDisplayProps
> = ({ existPages }) => {
  return (
    <div
      style={{
        marginTop: "8px",
        fontSize: "12px",
        padding: "5px",
        border: "1px solid #ffcdd2",
        backgroundColor: "#ffebee",
      }}
    >
      <strong style={{ color: "#c62828" }}>もう買ってるかも:</strong>
      {existPages.map((page) => (
        <a
          key={page.url}
          href={page.url}
          target="_blank"
          style={{
            marginLeft: "8px",
            color: "#007bff",
            textDecoration: "underline",
          }}
        >
          {page.name}
        </a>
      ))}
    </div>
  );
};

export function toCartScrapboxLinks(
  pages: ScrapboxPageDto[],
): CartScrapboxLink[] {
  return pages.map((p) => ({
    name: p.title,
    url: p.pageUrl,
  }));
}
