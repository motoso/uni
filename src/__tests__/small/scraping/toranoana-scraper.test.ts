import { describe, expect, test } from "@jest/globals";
import { parseHTML } from "linkedom";
import { scrapeToranoanaData } from "../../../scraping/toranoana-scraper";

function documentFromHtml(html: string, url: string): Document {
  const { document, HTMLElement } = parseHTML(html);
  Object.defineProperty(document, "location", {
    configurable: true,
    value: { href: url },
  });

  Object.defineProperty(HTMLElement.prototype, "rows", {
    configurable: true,
    get() {
      return this.tagName === "TABLE"
        ? this.querySelectorAll("tr")
        : undefined;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "cells", {
    configurable: true,
    get() {
      return this.tagName === "TR"
        ? this.querySelectorAll("th,td")
        : undefined;
    },
  });

  return document as unknown as Document;
}

describe("scrapeToranoanaData", () => {
  test("extracts product details from the current specification table", () => {
    // Captured from https://ec.toranoana.jp/tora_r/ec/item/040031259959/
    const document = documentFromHtml(
      `
        <h1 class="product-detail-desc-title"><span>放課後カノジョごっこ</span></h1>
        <table class="product-detail-spec-table">
          <tbody>
            <tr>
              <td class="fnt-bold">サークル名</td>
              <td>
                <div class="product-detail-spec-alert">
                  <a title="不可不可" href="/circle/example"><span>不可不可</span></a>
                  <a class="c-btn">入荷アラート<span>を設定</span></a>
                </div>
              </td>
            </tr>
            <tr>
              <td class="fnt-bold">作家</td>
              <td><a name="spec-actor"><span>関谷あさみ</span></a></td>
            </tr>
            <tr>
              <td class="fnt-bold">発行日</td>
              <td><span>2025/08/17</span></td>
            </tr>
            <tr>
              <td class="fnt-bold eventCell">初出イベント</td>
              <td><span>2025/08/17　コミックマーケット106（2日目）</span></td>
            </tr>
            <tr>
              <td class="fnt-bold">ジャンル/<br>サブジャンル</td>
              <td>
                <span class="js-product-detail-spec-genre">オリジナル</span>
                <a class="c-btn">入荷アラート<span>を設定</span></a>
              </td>
            </tr>
          </tbody>
        </table>
      `,
      "https://ec.toranoana.jp/tora_r/ec/item/040031259959/",
    );

    expect(scrapeToranoanaData(document)).toEqual({
      title: "放課後カノジョごっこ",
      authors: ["関谷あさみ"],
      circleName: "不可不可",
      genre: ["オリジナル"],
      mainCharacters: [],
      eventName: "コミックマーケット106（2日目）",
      publishedAt: new Date("2025-08-17"),
      url: "https://ec.toranoana.jp/tora_r/ec/item/040031259959/",
    });
  });
});
