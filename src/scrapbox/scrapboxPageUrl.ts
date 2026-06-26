import { SCRAPBOX_BASE_URL } from "./constants";

/**
 * Scrapboxのページ URL を組み立てる。
 * project 名と title から `https://scrapbox.io/{projectName}/{title}` を生成する。
 */
export const scrapboxPageUrl = (projectName: string, title: string): string =>
  `${SCRAPBOX_BASE_URL}/${projectName}/${encodeURIComponent(title)}`;
