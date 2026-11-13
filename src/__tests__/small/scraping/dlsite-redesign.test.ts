import { describe, expect, test } from "@jest/globals";
import { parseHTML } from "linkedom";
import { scrapeDLsiteBooksData } from "../../../scraping/dlsite-books-scraper";
import { scrapeDLsiteManiaxData } from "../../../scraping/dlsite-maniax-scraper";
import { scrapeDLsiteData } from "../../../scraping/dlsite-scraper";
import { asmrHtml, booksHtml, maniaxHtml } from "./fixtures/dlsite-redesign";

function productDocument(html: string): Document {
  const { document } = parseHTML(html);
  Object.defineProperty(document, "location", {
    value: { href: "https://www.dlsite.com/" },
  });
  return document as unknown as Document;
}

describe("DLsite redesigned product information", () => {
  test("extracts ASMR contributors without an author row", () => {
    expect(scrapeDLsiteManiaxData(productDocument(asmrHtml))).toMatchObject({
      type: "ボイス・ASMR",
      authors: [],
      circleName: "カモネギちゃんねる",
      writers: ["カモネギ"],
      illustrators: ["郁"],
      voiceActors: ["まあ油るる"],
      publishedAt: new Date("2026-06-06"),
    });
  });
  test("extracts Books author, publisher, label and date", () => {
    expect(scrapeDLsiteBooksData(productDocument(booksHtml))).toMatchObject({
      title: "えちえち本番ランド",
      authors: ["肉棒魔羅ノ進"],
      publisher: "ワニマガジン社",
      label: "WANIMAGAZINE COMICS SPECIAL",
      publishedAt: new Date("2025-08-22"),
    });
  });
  test("extracts Maniax maker, creator, format and date", () => {
    expect(scrapeDLsiteManiaxData(productDocument(maniaxHtml))).toMatchObject({
      authors: ["たいぷはてな"],
      circleName: "たいぷはてな",
      type: "マンガ",
      publishedAt: new Date("2025-02-16"),
    });
  });
  test("extracts DLsite maker and date instead of returning empty metadata", () => {
    expect(scrapeDLsiteData(productDocument(maniaxHtml))).toMatchObject({
      circleName: "たいぷはてな",
      publishedAt: new Date("2025-02-16"),
    });
  });
});
