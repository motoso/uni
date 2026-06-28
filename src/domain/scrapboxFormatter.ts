export type ScrapboxTemplateVars = Record<string, string>;

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
