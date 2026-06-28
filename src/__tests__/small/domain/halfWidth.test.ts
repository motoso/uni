import { test, expect, describe } from "@jest/globals";
import { toHalfWidth } from "../../../domain/halfWidth";

describe("toHalfWidth", () => {
  test("converts full-width alphanumerics matched by the pattern", () => {
    expect(toHalfWidth("ＡＢＣａｂｃ１２３", /[Ａ-Ｚａ-ｚ０-９]/g)).toBe(
      "ABCabc123",
    );
  });

  test("leaves characters not matched by the pattern untouched", () => {
    // 全角記号はパターンに含まれないので全角のまま残る
    expect(toHalfWidth("ＡＢＣ（１）", /[Ａ-Ｚａ-ｚ０-９]/g)).toBe("ABC（1）");
  });

  test("converts full-width ASCII symbols when included in the pattern", () => {
    expect(toHalfWidth("（）！？，＃", /[（）！？，＃]/g)).toBe("()!?,#");
  });

  test("converts only digits for the digit-only pattern", () => {
    expect(toHalfWidth("２０２１年１２月", /[０-９]/g)).toBe("2021年12月");
  });

  test("returns the input unchanged when nothing matches", () => {
    expect(toHalfWidth("あいうえお", /[０-９]/g)).toBe("あいうえお");
  });
});
