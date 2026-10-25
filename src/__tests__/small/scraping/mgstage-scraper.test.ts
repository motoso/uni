import { describe, expect, test } from "@jest/globals";
import { parseHTML } from "linkedom";
import { scrapeMgstageData } from "../../../scraping/mgstage-scraper";
import { mgstageSite } from "../../../sites/mgstage";
import { onecoinHtml, miumHtml } from "./fixtures/mgstage-html";

const url =
  "https://www.mgstage.com/product/product_detail/ONECOIN-MEGGHIT021/";

function documentFromHtml(html: string, href = url): Document {
  const { document } = parseHTML(html);
  Object.defineProperty(document, "location", { value: { href } });
  return document as unknown as Document;
}

describe("scrapeMgstageData", () => {
  test("extracts the supplied product without inventing missing credits", () => {
    const data = scrapeMgstageData(documentFromHtml(onecoinHtml));
    expect(data).toEqual({
      title:
        "私立パコパコ女子大学 女子大生とトラックテントで即ハメ旅 BEST 8時間 VOL.03 24名のイマドキ女子大生を突撃！スリルと大興奮のほぼ野外SEX！",
      url,
      actors: [],
      label: "",
      publishedAt: new Date("2023-01-01"),
      id: "ONECOIN-MEGGHIT021",
    });
    const body = mgstageSite.createProduct(data!).createScrapboxBodyString({});
    expect(body).toContain(`[MGS動画で視聴 ${url}]`);
    expect(body).toContain("[[ID]]：ONECOIN-MEGGHIT021");
    expect(body).toContain("[[発行年]]：[2023]/1/1");
    expect(body).not.toContain("プレステージ]");
  });

  test("extracts linked performer and label without splitting spaces in a name", () => {
    const data = scrapeMgstageData(documentFromHtml(miumHtml));
    expect(data?.actors).toEqual(["めぐみさん 24歳 受付嬢"]);
    expect(data?.label).toBe("prestigepremium");
    expect(data?.publishedAt).toEqual(new Date("2017-01-07"));
    expect(data?.id).toBe("300MIUM-001");
    const body = mgstageSite.createProduct(data!).createScrapboxBodyString({});
    expect(body).toContain("[[出演者]]：[めぐみさん 24歳 受付嬢]");
    expect(body).toContain("[[レーベル]]：[prestigepremium]");
  });

  test("keeps each performer link as a separate credit", () => {
    const html = miumHtml.replace(
      "</td></tr>",
      '<a href="/search/cSearch.php?actor[]=other">別の出演者</a></td></tr>',
    );
    expect(scrapeMgstageData(documentFromHtml(html))?.actors).toEqual([
      "めぐみさん 24歳 受付嬢",
      "別の出演者",
    ]);
  });

  test.each(["", "<h1>MGS動画 年齢確認</h1>", '<h1 class="tag">商品名</h1>'])(
    "does not scrape an incomplete or age-check page: %s",
    (html) => {
      expect(scrapeMgstageData(documentFromHtml(html))).toBeNull();
    },
  );

  test.each(["未定", "2023/02/30"])(
    "treats an invalid publication date as unknown: %s",
    (date) => {
      expect(
        scrapeMgstageData(
          documentFromHtml(onecoinHtml.replace("2023/01/01", date)),
        )?.publishedAt,
      ).toBeNull();
    },
  );
});
