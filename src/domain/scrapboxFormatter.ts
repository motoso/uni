export type ScrapboxTemplateVars = Record<string, string>;

/**
 * productType ごとの Scrapbox 本文フォーマット。
 * `browser.storage.sync` に保存される値の plain な形。
 */
export type ScrapboxFormats = Record<string, string>;

export const pageLinks = (values: readonly string[] | null | undefined) =>
  values?.map((value) => `[${value}]`).join(" ") ?? "";

export const pageLink = (value: string | null | undefined) =>
  value ? `[${value}]` : "";

export const formatScrapboxBody = (
  format: string,
  vars: ScrapboxTemplateVars,
): string => {
  return format.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, key) => {
    return vars[key] ?? placeholder;
  });
};
