import type { Page } from "@playwright/test";
import { jest } from "@jest/globals";
import {
  bypassDmmAgeCheckWithCookie,
  getDmmAgeCheckRedirectUrl,
} from "../../support/dmm-age-verification";

describe("getDmmAgeCheckRedirectUrl", () => {
  it("extracts a FANZA destination from the age-check rurl", () => {
    expect(
      getDmmAgeCheckRedirectUrl(
        "https://www.dmm.co.jp/age_check/=/?rurl=https%3A%2F%2Fvideo.dmm.co.jp%2Fanime%2Fcontent%2F%3Fid%3D196glod00333",
      ),
    ).toBe("https://video.dmm.co.jp/anime/content/?id=196glod00333");
  });

  it("preserves additional query parameters encoded inside rurl", () => {
    expect(
      getDmmAgeCheckRedirectUrl(
        "https://www.dmm.co.jp/age_check/=/?rurl=https%3A%2F%2Fbook.dmm.co.jp%2Fproduct%2F4425627%2Fb425aakkg00576%2F%3Fforce%3Dtrue",
      ),
    ).toBe("https://book.dmm.co.jp/product/4425627/b425aakkg00576/?force=true");
  });

  it("rejects a non-DMM redirect destination", () => {
    expect(
      getDmmAgeCheckRedirectUrl(
        "https://www.dmm.co.jp/age_check/=/?rurl=https%3A%2F%2Fexample.com%2Fphishing",
      ),
    ).toBeUndefined();
  });

  it("rejects non-HTTPS and malformed URLs", () => {
    expect(
      getDmmAgeCheckRedirectUrl(
        "https://www.dmm.co.jp/age_check/=/?rurl=http%3A%2F%2Fvideo.dmm.co.jp%2Fcontent",
      ),
    ).toBeUndefined();
    expect(getDmmAgeCheckRedirectUrl("not a url")).toBeUndefined();
  });
});

describe("bypassDmmAgeCheckWithCookie", () => {
  it("sets the accepted-age cookie and navigates to the DMM rurl", async () => {
    const addCookies = jest.fn(async () => undefined);
    const goto = jest.fn(async () => undefined);
    const page = {
      url: () =>
        "https://www.dmm.co.jp/age_check/=/?rurl=https%3A%2F%2Fvideo.dmm.co.jp%2Fanime%2Fcontent%2F%3Fid%3D196glod00333",
      context: () => ({ addCookies }),
      goto,
    } as unknown as Page;

    await expect(bypassDmmAgeCheckWithCookie(page)).resolves.toBe(true);
    expect(addCookies).toHaveBeenCalledWith([
      expect.objectContaining({
        name: "age_check_done",
        value: "1",
        domain: ".dmm.co.jp",
      }),
    ]);
    expect(goto).toHaveBeenCalledWith(
      "https://video.dmm.co.jp/anime/content/?id=196glod00333",
      { waitUntil: "domcontentloaded" },
    );
  });

  it("does not mutate browser state for an unsafe rurl", async () => {
    const addCookies = jest.fn();
    const goto = jest.fn();
    const page = {
      url: () =>
        "https://www.dmm.co.jp/age_check/=/?rurl=https%3A%2F%2Fexample.com%2Fphishing",
      context: () => ({ addCookies }),
      goto,
    } as unknown as Page;

    await expect(bypassDmmAgeCheckWithCookie(page)).resolves.toBe(false);
    expect(addCookies).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });
});
