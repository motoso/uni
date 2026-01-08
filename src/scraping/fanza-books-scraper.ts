import { FanzaBooksScrapedData } from './types';

/**
 * Pure function to scrape FANZA Books data from the DOM
 * This function contains the core scraping logic without any UI dependencies
 */
export function scrapeFanzaBooksData(document: Document): FanzaBooksScrapedData | null {
  // 全てのdl要素を取得（2025年11月時点のDOM構造では各フィールドが別々のdlに分かれている）
  const dlElements = document.querySelectorAll("dl");

  if (!dlElements || dlElements.length === 0) {
    console.error("No dl elements found");
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

  // 全てのdl要素を走査
  dlElements.forEach((dl) => {
    const dt = dl.querySelector("dt");
    const dd = dl.querySelector("dd");

    if (!dt || !dd) return;

    const keyText = dt.textContent?.trim() || "";
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