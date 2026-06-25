import { describe, expect, test } from "@jest/globals";
import {
  DLSITE_MANIAX_ASMR_TYPE,
  scrapeDLsiteManiaxData,
} from "../../../scraping/dlsite-maniax-scraper";

describe("scrapeDLsiteManiaxData", () => {
  test("extracts ASMR details when cells contain layout whitespace and no 作者 row", () => {
    const makeAnchor = (textContent: string) => ({ textContent });
    const makeCell = (textContent: string, links: string[] = []) => {
      const anchors = links.map(makeAnchor);

      return {
        textContent,
        querySelector: (selector: string) =>
          selector === ".maker_name a" ? anchors[0] || null : null,
        querySelectorAll: (selector: string) =>
          selector === "a" ? anchors : [],
      };
    };
    const makeRow = (label: string, value: string, links: string[] = []) => ({
      cells: [makeCell(label), makeCell(value, links)],
    });
    const makeTable = (rows: ReturnType<typeof makeRow>[]) => ({ rows });

    const document = {
      location: {
        href: "https://www.dlsite.com/maniax/work/=/product_id/RJ01591453.html",
      },
      getElementById: (id: string) => {
        const elements: Record<string, unknown> = {
          work_name: {
            textContent:
              "【心情代弁特化】グラドルJK姉妹の鍵垢バレ童貞いじめドスケベエッチ！",
          },
          work_maker: makeTable([
            makeRow("サークル名", "\n カモネギちゃんねる \n", [
              "カモネギちゃんねる",
            ]),
          ]),
          work_outline: makeTable([
            makeRow("販売日", "2026年06月06日", ["2026年06月06日"]),
            makeRow("シナリオ", "\n カモネギ \n", ["カモネギ"]),
            makeRow("イラスト", "\n 郁 \n", ["郁"]),
            makeRow("声優", "\n まあ油るる \n", ["まあ油るる"]),
            makeRow("作品形式", "\n ボイス・ASMR \n", ["ボイス・ASMR"]),
          ]),
        };

        return elements[id] || null;
      },
    } as unknown as Document;

    const result = scrapeDLsiteManiaxData(document);

    expect(result).toBeTruthy();
    expect(result?.type).toBe(DLSITE_MANIAX_ASMR_TYPE);
    expect(result?.circleName).toBe("カモネギちゃんねる");
    expect(result?.authors).toEqual([]);
    expect(result?.writers).toEqual(["カモネギ"]);
    expect(result?.illustrators).toEqual(["郁"]);
    expect(result?.voiceActors).toEqual(["まあ油るる"]);
    expect(result?.publishedAt).toEqual(new Date("2026-06-06"));
  });
});
