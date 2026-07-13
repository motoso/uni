import browser from "webextension-polyfill";
import { StorageKeyProjectName } from "../chromeApi";
import type { ProjectNameReader } from "../ports/bibliographySearch";

export const readProjectName: ProjectNameReader = async () => {
  const items = await browser.storage.sync.get([StorageKeyProjectName]);
  return (items[StorageKeyProjectName] as string) ?? "";
};
