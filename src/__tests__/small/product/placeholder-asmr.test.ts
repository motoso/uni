import { test, expect, describe, beforeEach } from "@jest/globals";
import Asmr from "../../../Asmr";
import { AcceptedService } from "../../../constant";
import dayjs from "dayjs";

describe("Asmr placeholder replacement", () => {
  const mockAsmrData = {
    service: AcceptedService.dlsite,
    title: "テストASMR",
    authors: ["作者E"], // ASMRの場合、authorsは通常サークル名だがテストのため汎用的に
    url: "https://example.com/asmr",
    publishedAt: dayjs("2020-10-29"),
    circleName: "テストASMRサークル",
    eventName: "ASMRイベント秋",
    illustrators: ["絵師F", "絵師G"],
    voiceActors: ["声優H", "声優I"],
    writers: ["作家J"],
  };

  beforeEach(() => {
    // @ts-ignore
    browser.storage.sync.get.mockReset();
  });

  test("should replace ASMR specific placeholders in custom format", async () => {
    const asmr = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      mockAsmrData.publishedAt,
      mockAsmrData.circleName,
      mockAsmrData.eventName,
      mockAsmrData.illustrators,
      mockAsmrData.voiceActors,
      mockAsmrData.writers,
    );

    const customFormat =
      "作品:{title} サークル:{circleName} イベント:{eventName} イラスト:{illustrators} 声優:{voiceActors} シナリオ:{writers} 年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { asmr: customFormat },
    });

    const body = await asmr.createScrapboxBodyString();
    expect(body).toBe(
      "作品:テストASMR サークル:[テストASMRサークル] イベント:[ASMRイベント秋] イラスト:[絵師F] [絵師G] 声優:[声優H] [声優I] シナリオ:[作家J] 年:2020",
    );
  });

  test("should handle null/empty arrays for list-type placeholders in custom format", async () => {
    const asmr = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      mockAsmrData.publishedAt,
      "サークルのみ",
      null, // eventName null
      null, // illustrators null
      [], // voiceActors empty
      mockAsmrData.writers,
    );

    const customFormat =
      "サークル:{circleName} イベント:{eventName} イラスト:{illustrators} 声優:{voiceActors} シナリオ:{writers}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { asmr: customFormat },
    });
    const body = await asmr.createScrapboxBodyString();
    expect(body).toBe(
      "サークル:[サークルのみ] イベント: イラスト: 声優: シナリオ:[作家J]",
    );
  });

  test("should use default format if custom format is not available", async () => {
    const asmrFull = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      mockAsmrData.publishedAt,
      mockAsmrData.circleName,
      mockAsmrData.eventName,
      mockAsmrData.illustrators,
      mockAsmrData.voiceActors,
      mockAsmrData.writers,
    );

    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });

    const body = await asmrFull.createScrapboxBodyString();
    expect(body).toContain(`[[サークル名]]：[${mockAsmrData.circleName}]`);
    expect(body).toContain(`[[イベント]]: [${mockAsmrData.eventName}]`);
    expect(body).toContain(`[[イラストレーター]]：[絵師F] [絵師G]`);
    expect(body).toContain(`[[声優]]：[声優H] [声優I]`);
    expect(body).toContain(`[[シナリオライター]]：[作家J]`);
    expect(body).toContain(`[${mockAsmrData.service}で読む ${mockAsmrData.url}]`);
    expect(body).toContain(`[[著者]]：[作者E]`); // authorsはAsmrクラスではcircleNameとは別扱い
    expect(body).toContain(`[[発行年]]：[2020]/10/29`);
  });

  test("default format handles null/empty list-type properties correctly", async () => {
    const asmrPartial = Asmr.make(
      mockAsmrData.service,
      "部分情報ASMR",
      ["作者X"],
      mockAsmrData.url,
      mockAsmrData.publishedAt,
      "部分サークル",
      null, // event null
      [], // illustrators empty
      null, // voiceActors null
      ["作家Y"],
    );
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });
    const bodyPartial = await asmrPartial.createScrapboxBodyString();

    expect(bodyPartial).toContain(`[[サークル名]]：[部分サークル]`);
    expect(bodyPartial).toContain(`[[イベント]]: `); // null eventName becomes empty
    expect(bodyPartial).not.toContain(`[[イベント]]: [null]`);
    expect(bodyPartial).not.toContain(`[[イベント]]: []`);
    expect(bodyPartial).toContain(`[[イラストレーター]]：`); // empty illustrators becomes empty
    expect(bodyPartial).toContain(`[[声優]]：`); // null voiceActors becomes empty
    expect(bodyPartial).toContain(`[[シナリオライター]]：[作家Y]`);
  });

  test("should correctly format year with default format (year with brackets)", async () => {
    const asmr = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      dayjs("2020-03-25"),
      mockAsmrData.circleName,
      mockAsmrData.eventName,
      mockAsmrData.illustrators,
      mockAsmrData.voiceActors,
      mockAsmrData.writers,
    );
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({ scrapboxFormats: {} });
    const body = await asmr.createScrapboxBodyString();
    expect(body).toContain("[[発行年]]：[2020]/3/25");
  });

  test("should correctly format year with custom format (year without brackets)", async () => {
    const asmr = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      dayjs("2020-03-25"),
      mockAsmrData.circleName,
      mockAsmrData.eventName,
      mockAsmrData.illustrators,
      mockAsmrData.voiceActors,
      mockAsmrData.writers,
    );
    const customFormat = "年:{publishedYear}";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { asmr: customFormat },
    });
    const body = await asmr.createScrapboxBodyString();
    expect(body).toBe("年:2020");
  });

  test("should correctly format year with custom format (year with brackets by user)", async () => {
    const asmr = Asmr.make(
      mockAsmrData.service,
      mockAsmrData.title,
      mockAsmrData.authors,
      mockAsmrData.url,
      dayjs("2020-03-25"),
      mockAsmrData.circleName,
      mockAsmrData.eventName,
      mockAsmrData.illustrators,
      mockAsmrData.voiceActors,
      mockAsmrData.writers,
    );
    const customFormat = "年:[{publishedYear}]";
    // @ts-ignore
    browser.storage.sync.get.mockResolvedValueOnce({
      scrapboxFormats: { asmr: customFormat },
    });
    const body = await asmr.createScrapboxBodyString();
    expect(body).toBe("年:[2020]");
  });
});