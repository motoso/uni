import { test, expect, describe, beforeEach } from "@jest/globals";
import Doujinshi from "../../../Doujinshi";
import { AcceptedService } from "../../../constant";
import dayjs from "dayjs";

describe("Doujinshi placeholder replacement", () => {
  const mockDoujinshiData = {
    service: AcceptedService.fanzaDojin,
    title: "テスト同人誌",
    authors: ["著者A", "著者B"],
    url: "https://example.com/doujin",
    publishedAt: dayjs("2022-12-31"),
  };

  beforeEach(() => {
    // jest.setup.js のモックをクリアまたはデフォルトに戻す
    // @ts-ignore
    browser.storage.sync.get.mockReset();
  });

  test("should replace doujinshi specific placeholders in custom format", async () => {
    const doujinshi = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      mockDoujinshiData.publishedAt,
      "テストサークル",
      "テストイベント",
    );

    const customFormat =
      "タイトル:{title} サークル:{circleName} イベント:{eventName} 発行年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { doujinshi: customFormat },
    });

    const body = await doujinshi.createScrapboxBodyString();
    expect(body).toBe(
      "タイトル:テスト同人誌 サークル:[テストサークル] イベント:[テストイベント] 発行年:2022",
    );
  });

  test("should handle null circleName and eventName in custom format", async () => {
    const doujinshi = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      mockDoujinshiData.publishedAt,
      null, // circleName is null
      null, // eventName is null
    );

    const customFormat = "サークル:{circleName} イベント:{eventName} タイトル:{title}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { doujinshi: customFormat },
    });

    const body = await doujinshi.createScrapboxBodyString();
    expect(body).toBe("サークル: イベント: タイトル:テスト同人誌");
  });

  test("should use default format if custom format is not available", async () => {
    const doujinshiWithDetails = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      mockDoujinshiData.publishedAt,
      "存在するサークル",
      "存在するイベント",
    );

    // カスタムフォーマットが設定されていない状態を模倣
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });

    let body = await doujinshiWithDetails.createScrapboxBodyString();
    expect(body).toContain("[[サークル名]]：[存在するサークル]");
    expect(body).toContain("[[イベント]]: [存在するイベント]");
    expect(body).toContain(`[${mockDoujinshiData.service}で読む ${mockDoujinshiData.url}]`);
    expect(body).toContain(`[[著者]]：[著者A] [著者B]`);
    expect(body).toContain(`[[発行年]]：[2022]/12/31`);

    const doujinshiWithoutEvent = Doujinshi.make(
      mockDoujinshiData.service,
      "イベント無し同人誌",
      [],
      mockDoujinshiData.url,
      mockDoujinshiData.publishedAt,
      "サークルのみ",
      null, // eventName is null
    );
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });
    body = await doujinshiWithoutEvent.createScrapboxBodyString();
    expect(body).toContain("[[サークル名]]：[サークルのみ]");
    expect(body).toContain("[[イベント]]: "); // eventNameがnullなので空になる
    expect(body).not.toContain("[[イベント]]: null"); // Ensure it doesn't output "[null]"
    expect(body).not.toContain("[[イベント]]: []"); // Ensure it doesn't output "[]" for null event
  });

  test("should correctly format year with default format (year with brackets)", async () => {
    const doujinshi = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      dayjs("2022-08-10"),
      "サークル",
      "イベント",
    );
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });
    const body = await doujinshi.createScrapboxBodyString();
    expect(body).toContain("[[発行年]]：[2022]/8/10");
  });

  test("should correctly format year with custom format (year without brackets)", async () => {
    const doujinshi = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      dayjs("2022-08-10"),
      "サークル",
      "イベント",
    );
    const customFormat = "発行年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { doujinshi: customFormat },
    });
    const body = await doujinshi.createScrapboxBodyString();
    expect(body).toBe("発行年:2022");
  });

  test("should correctly format year with custom format (year with brackets by user)", async () => {
    const doujinshi = Doujinshi.make(
      mockDoujinshiData.service,
      mockDoujinshiData.title,
      mockDoujinshiData.authors,
      mockDoujinshiData.url,
      dayjs("2022-08-10"),
      "サークル",
      "イベント",
    );
    const customFormat = "発行年:[{publishedYear}]";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { doujinshi: customFormat },
    });
    const body = await doujinshi.createScrapboxBodyString();
    expect(body).toBe("発行年:[2022]");
  });
});