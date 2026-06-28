import browser from "webextension-polyfill";
import { StorageKeyScrapboxFormats } from "../chromeApi";
import { ScrapboxFormats } from "../domain/scrapboxFormatter";

/**
 * `browser.storage.sync` から productType ごとの Scrapbox 本文フォーマットを読む。
 * 保存されていない場合は空オブジェクトを返す。
 */
export const readScrapboxFormats = async (): Promise<ScrapboxFormats> => {
  const result = await browser.storage.sync.get([StorageKeyScrapboxFormats]);
  return (result[StorageKeyScrapboxFormats] as ScrapboxFormats) ?? {};
};
