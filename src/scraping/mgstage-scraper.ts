import type { MgstageScrapedData } from "./types";

export function scrapeMgstageData(
  document: Document,
): MgstageScrapedData | null {
  const title = document
    .querySelector(".common_detail_cover h1.tag")
    ?.textContent?.trim();
  if (!title) return null;

  const fields = new Map<string, Element>();
  for (const row of document.querySelectorAll(".detail_data table tr")) {
    const key = row.querySelector("th")?.textContent?.trim().replace(/：$/, "");
    const cell = row.querySelector("td");
    if (key && cell) fields.set(key, cell);
  }
  const text = (key: string) => fields.get(key)?.textContent?.trim() || "";
  const id = text("品番");
  if (!id) return null;

  const dateText = text("配信開始日");
  const dateMatch = dateText.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  const dateIso = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : "";
  const date = new Date(dateIso);
  const publishedAt =
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateIso
      ? date
      : null;

  const actors = Array.from(fields.get("出演")?.querySelectorAll("a") || [])
    .map((link) => link.textContent?.trim() || "")
    .filter(Boolean);

  return {
    title,
    url: document.location.href,
    actors,
    label: text("レーベル"),
    publishedAt,
    id,
  };
}
