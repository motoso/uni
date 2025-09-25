import { FanzaBooksScrapedData } from './types';

/**
 * Pure function to scrape FANZA Books data from the DOM
 * This function contains the core scraping logic without any UI dependencies
 */
export function scrapeFanzaBooksData(document: Document): FanzaBooksScrapedData | null {
  // メインテーブル取得 - 複数のセレクターを試行
  const mainTable = document.querySelector(".css-1omcat5") ||
                    document.querySelector("dl");
  const dts = mainTable?.querySelectorAll("dt");
  const dds = mainTable?.querySelectorAll("dd");

  if (!mainTable || !dts || !dds) {
    console.error("Main table not found");
    return null;
  }

  const result = {
    title: "",
    authors: [],
    label: "",
    publisher: "",
    publishedAt: "",
  };

  // ddからテキストを安全に取得する関数
  const getValueText = (dd: Element): string => {
    // まずaタグを探す
    const link = dd.querySelector("a");
    if (link) {
      return link.textContent?.trim() || "";
    }

    // aタグがない場合はspanを探す
    const span = dd.querySelector("span");
    if (span) {
      return span.textContent?.trim() || "";
    }

    // どちらもない場合は直接テキストを取得
    return dd.textContent?.trim() || "";
  };

  dts.forEach((dt, i) => {
    const keyText = dt.textContent?.trim() || "";
    const dd = dds[i];
    if (!dd) return;

    const valueText = getValueText(dd);

    switch (keyText) {
      case "シリーズ名":
        result.title = valueText;
        break;
      case "作家":
        result.authors = valueText.split(",").map((item) => item.trim()).filter(item => item);
        break;
      case "掲載誌・レーベル":
        result.label = valueText;
        break;
      case "出版社":
        result.publisher = valueText;
        break;
      case "配信開始日":
        result.publishedAt = valueText;
        break;
    }
  });

  if (!result.title) {
    console.error("タイトルが見つかりません");
    return null;
  }

  const url = document.location.href;
  const publishedAt = new Date(result.publishedAt);

  return {
    title: result.title,
    url,
    authors: result.authors,
    label: result.label,
    publisher: result.publisher,
    publishedAt,
  };
}