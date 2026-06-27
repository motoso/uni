import { describe, expect, test } from "@jest/globals";
import { parseHTML } from "linkedom";
import { scrapeBookWalkerData } from "../../../scraping/bookwalker-scraper";
import { scrapeDLsiteBooksData } from "../../../scraping/dlsite-books-scraper";
import { scrapeDLsiteManiaxData } from "../../../scraping/dlsite-maniax-scraper";
import { scrapeFanzaBooksData } from "../../../scraping/fanza-books-scraper";
import { scrapeFanzaDoujinData } from "../../../scraping/fanza-doujin-scraper";
import { scrapeFanzaVideoData } from "../../../scraping/fanza-video-scraper";
import {
  bookWalkerHtml,
  dlsiteBooksHtml,
  dlsiteManiaxHtml,
  fanzaBooksHtml,
  fanzaDoujinHtml,
  fanzaVideoHtml,
} from "./fixtures/real-html";

function documentFromRealHtml(html: string, url: string): Document {
  const { document, HTMLElement } = parseHTML(html);
  Object.defineProperty(document, "location", {
    configurable: true,
    value: { href: url },
  });

  if (!("rows" in document.createElement("table"))) {
    Object.defineProperty(HTMLElement.prototype, "rows", {
      configurable: true,
      get() {
        return this.tagName === "TABLE"
          ? this.querySelectorAll("tr")
          : undefined;
      },
    });
  }

  if (!("cells" in document.createElement("tr"))) {
    Object.defineProperty(HTMLElement.prototype, "cells", {
      configurable: true,
      get() {
        return this.tagName === "TR"
          ? this.querySelectorAll("th,td")
          : undefined;
      },
    });
  }

  return document as unknown as Document;
}

describe("scraper fixtures from real product HTML", () => {
  test("extracts FANZA Books details from captured product page", () => {
    const document = documentFromRealHtml(
      fanzaBooksHtml,
      "https://book.dmm.co.jp/product/4425627/b425aakkg00576/",
    );

    const result = scrapeFanzaBooksData(document);

    expect(result).toEqual({
      title: "オーバーキル【FANZA限定特典付き】",
      url: "https://book.dmm.co.jp/product/4425627/b425aakkg00576/",
      authors: ["鬼束直"],
      label: "TENMA COMICS LO",
      publisher: "茜新社",
      publishedAt: new Date("2024/01/01"),
    });
  });

  test("extracts FANZA Doujin details from captured product page", () => {
    const document = documentFromRealHtml(
      fanzaDoujinHtml,
      "https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=d_335698/",
    );

    const result = scrapeFanzaDoujinData(document);

    expect(result).toEqual({
      title: "サーシャちゃんがようこそ〜ふとしくんルート総集編〜",
      url: "https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=d_335698/",
      circleName: "臨終サーカス",
      authors: [],
      publishedAt: new Date("2024-02-01"),
    });
  });

  test("extracts FANZA Video details from captured product page", () => {
    const document = documentFromRealHtml(
      fanzaVideoHtml,
      "https://video.dmm.co.jp/av/content/?id=apns00240",
    );

    const result = scrapeFanzaVideoData(document);

    expect(result).toEqual({
      title: "堕とされた巨乳若女将 姫咲はな",
      url: "https://video.dmm.co.jp/av/content/?id=apns00240",
      actress: ["姫咲はな"],
      director: "那須之浩",
      label: "オーロラプロジェクト・アネックス",
      publishedAt: new Date("2021-05-08"),
      id: "APNS-240",
    });
  });

  test("extracts DLsite Books details from captured product page", () => {
    const document = documentFromRealHtml(
      dlsiteBooksHtml,
      "https://www.dlsite.com/books/work/=/product_id/BJ02112599.html",
    );

    const result = scrapeDLsiteBooksData(document);

    expect(result).toEqual({
      title: "えちえち本番ランド",
      authors: ["肉棒魔羅ノ進"],
      label: "  WANIMAGAZINE COMICS SPECIAL  ",
      publisher: "  ワニマガジン社  ",
      publishedAt: new Date("2025-08-22"),
      url: "https://www.dlsite.com/books/work/=/product_id/BJ02112599.html",
    });
  });

  test("extracts DLsite Maniax details from captured product page", () => {
    const document = documentFromRealHtml(
      dlsiteManiaxHtml,
      "https://www.dlsite.com/maniax/work/=/product_id/RJ01341329.html",
    );

    const result = scrapeDLsiteManiaxData(document);

    expect(result).toEqual({
      title:
        "某都立○学に、教え子マインドコントロールしてハメ撮りしまくってた頭バグってる教師がいたらしい",
      type: "マンガ",
      authors: ["たいぷはてな"],
      voiceActors: [],
      illustrators: [],
      writers: [],
      circleName: "たいぷはてな",
      eventName: "コミティア",
      publishedAt: new Date("2025-02-16"),
      url: "https://www.dlsite.com/maniax/work/=/product_id/RJ01341329.html",
    });
  });

  test("extracts BookWalker details from captured product page", () => {
    const document = documentFromRealHtml(
      bookWalkerHtml,
      "https://bookwalker.jp/defb2e0181-c515-4443-9039-11b07c68a30b/",
    );

    const result = scrapeBookWalkerData(document);

    expect(result).toEqual({
      title: "生徒会にも穴はある！（８）",
      authors: ["むちまろ"],
      publisher: "講談社",
      label: "週刊少年マガジン",
      publishedAt: "2024/11/15",
      url: "https://bookwalker.jp/defb2e0181-c515-4443-9039-11b07c68a30b/",
    });
  });
});
