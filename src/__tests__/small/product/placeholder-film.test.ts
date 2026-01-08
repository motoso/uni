import { test, expect, describe, beforeEach } from "@jest/globals";
import Film from "../../../Film";
import { AcceptedService } from "../../../constant";
import dayjs from "dayjs";

describe("Film placeholder replacement", () => {
  const mockFilmData = {
    service: AcceptedService.fanza,
    title: "テスト映画",
    actors: ["俳優A", "俳優B"],
    url: "https://example.com/movie",
    publishedAt: dayjs("2023-01-01"),
  };

  beforeEach(() => {
    // jest.setup.js のモックをクリアまたはデフォルトに戻す場合
    // browser.storage.sync.get.mockResolvedValue({ scrapboxFormats: {} });
  });

  test("should replace film specific placeholders in custom format", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "テスト監督",
      mockFilmData.url,
      mockFilmData.publishedAt,
      "テストレーベル",
      "test_id_123",
    );

    const customFormat =
      "タイトル:{title} ID:{id} 監督:{director} レーベル:{label} 公開年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { film: customFormat },
    });

    const body = await film.createScrapboxBodyString();
    expect(body).toBe(
      "タイトル:テスト映画 ID:test_id_123 監督:[テスト監督] レーベル:[テストレーベル] 公開年:2023",
    );
  });

  test("should handle null director and label in custom format", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      null, // director is null
      mockFilmData.url,
      mockFilmData.publishedAt,
      null, // label is null
      "test_id_456",
    );

    const customFormat = "ID:{id} 監督:{director} レーベル:{label}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { film: customFormat },
    });

    const body = await film.createScrapboxBodyString();
    expect(body).toBe("ID:test_id_456 監督: レーベル:");
  });

  test("should use default format if custom format is not available", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "いる監督",
      mockFilmData.url,
      mockFilmData.publishedAt,
      "存在するレーベル",
      "default_id_789",
    );

    // カスタムフォーマットが設定されていない状態を模倣
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });

    const body = await film.createScrapboxBodyString();
    // Film.tsのdefaultScrapboxFormatの出力を期待値とする
    // 注意: defaultScrapboxFormatは {placeholder} ではなく直接 this._director などを使っている
    // そのため、replacePlaceholdersのテストとは少し意味合いが異なるが、最終出力の確認にはなる
    expect(body).toContain("[[監督]]： [いる監督]");
    expect(body).toContain("[[レーベル]]：[存在するレーベル]");
    expect(body).toContain("[[ID]]：default_id_789");
    expect(body).toContain(`[${mockFilmData.service}で視聴 ${mockFilmData.url}]`);
    expect(body).toContain("俳優A");
    expect(body).toContain(`[[発行年]]：[2023]/1/1`);
  });

  test("should correctly format year with default format (year with brackets)", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "監督",
      mockFilmData.url,
      dayjs("2023-07-15"),
      "レーベル",
      "id123",
    );
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} }); // Use default format
    const body = await film.createScrapboxBodyString();
    expect(body).toContain("[[発行年]]：[2023]/7/15");
  });

  test("should correctly format year with custom format (year without brackets)", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "監督",
      mockFilmData.url,
      dayjs("2023-07-15"),
      "レーベル",
      "id123",
    );
    const customFormat = "公開年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { film: customFormat },
    });
    const body = await film.createScrapboxBodyString();
    expect(body).toBe("公開年:2023");
  });

  test("should correctly format year with custom format (year with brackets by user)", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "監督",
      mockFilmData.url,
      dayjs("2023-07-15"),
      "レーベル",
      "id123",
    );
    const customFormat = "公開年:[{publishedYear}]";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { film: customFormat },
    });
    const body = await film.createScrapboxBodyString();
    expect(body).toBe("公開年:[2023]");
  });

  test("should handle null id in custom format (though _id is string, constructor allows null)", async () => {
    const film = Film.make(
      mockFilmData.service,
      mockFilmData.title,
      mockFilmData.actors,
      "監督名",
      mockFilmData.url,
      mockFilmData.publishedAt,
      "レーベル名",
      null, // id is null
    );

    const customFormat = "ID:{id} タイトル:{title}";
     // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { film: customFormat },
    });

    const body = await film.createScrapboxBodyString();
    expect(body).toBe("ID: タイトル:テスト映画");
  });
});