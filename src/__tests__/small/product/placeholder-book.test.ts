import { test, expect, describe } from "@jest/globals";
import Book from "../../../Book";
import { AcceptedService } from "../../../constant";
import dayjs from "dayjs";

describe("Book placeholder replacement", () => {
  const mockBookData = {
    service: AcceptedService.fanza, // Changed dmmBooks to fanza
    title: "テスト書籍",
    authors: ["著者C", "著者D"],
    url: "https://example.com/book",
    publishedAt: dayjs("2021-11-30"),
  };

  test("should replace book specific placeholders in custom format", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      "テスト出版社",
      "テストレーベル",
      mockBookData.publishedAt,
    );

    const customFormat =
      "タイトル:{title} 出版社:{publisher} レーベル:{label} 発行年:{publishedYear}";
    const body = book.createScrapboxBodyString({ book: customFormat });
    expect(body).toBe(
      "タイトル:テスト書籍 出版社:[テスト出版社] レーベル:[テストレーベル] 発行年:2021",
    );
  });

  test("should handle null publisher and label in custom format", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      null, // publisher is null
      null, // label is null
      mockBookData.publishedAt,
    );

    const customFormat = "出版社:{publisher} レーベル:{label} タイトル:{title}";
    const body = book.createScrapboxBodyString({ book: customFormat });
    expect(body).toBe("出版社: レーベル: タイトル:テスト書籍");
  });

  test("should use default format if custom format is not available", () => {
    const bookWithDetails = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      "存在する出版社",
      "存在するレーベル",
      mockBookData.publishedAt,
    );

    const body = bookWithDetails.createScrapboxBodyString({});
    expect(body).toContain("[[出版社]]: [存在する出版社]");
    expect(body).toContain("[[レーベル]]：[存在するレーベル]"); // defaultScrapboxFormatのtypoも考慮(：が全角)
    expect(body).toContain(
      `[${mockBookData.service}で読む ${mockBookData.url}]`,
    );
    expect(body).toContain(`[[著者]]：[著者C] [著者D]`);
    expect(body).toContain(`[[発行年]]：[2021]/11/30`);
  });

  // 経路一本化後: default format でも null フィールドは接頭辞を残して値だけ空になる
  // （旧 default の「行ごと省略」から custom 経路と同じ挙動に統一）
  test("default format keeps label/publisher prefixes empty for null fields", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      null, // publisher
      null, // label
      mockBookData.publishedAt,
    );

    const body = book.createScrapboxBodyString({});
    expect(body).toContain("[[レーベル]]：\n");
    expect(body).toContain("[[出版社]]: \n");
    expect(body).not.toContain("null");
  });

  test("should correctly format year with default format (year with brackets)", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      "出版社",
      "レーベル",
      dayjs("2021-05-20"),
    );
    const body = book.createScrapboxBodyString({});
    expect(body).toContain("[[発行年]]：[2021]/5/20");
  });

  test("should correctly format year with custom format (year without brackets)", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      "出版社",
      "レーベル",
      dayjs("2021-05-20"),
    );
    const customFormat = "発行:{publishedYear}";
    const body = book.createScrapboxBodyString({ book: customFormat });
    expect(body).toBe("発行:2021");
  });

  test("should correctly format year with custom format (year with brackets by user)", () => {
    const book = Book.make(
      mockBookData.service,
      mockBookData.title,
      mockBookData.authors,
      mockBookData.url,
      "出版社",
      "レーベル",
      dayjs("2021-05-20"),
    );
    const customFormat = "発行:[{publishedYear}]";
    const body = book.createScrapboxBodyString({ book: customFormat });
    expect(body).toBe("発行:[2021]");
  });
});
