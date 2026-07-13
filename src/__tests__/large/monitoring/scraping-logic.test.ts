import { test, expect, type Page } from "@playwright/test";
import { scrapeFanzaVideoData } from "../../../scraping/fanza-video-scraper";
import { scrapeFanzaDoujinData } from "../../../scraping/fanza-doujin-scraper";
import { scrapeFanzaBooksData } from "../../../scraping/fanza-books-scraper";
import { scrapeAmazonData } from "../../../scraping/amazon-scraper";
import { scrapeBookWalkerData } from "../../../scraping/bookwalker-scraper";
import { scrapeDLsiteData } from "../../../scraping/dlsite-scraper";
import { scrapeDLsiteBooksData } from "../../../scraping/dlsite-books-scraper";
import { scrapeMelonbooksData } from "../../../scraping/melonbooks-scraper";
import { scrapeDLsiteManiaxData } from "../../../scraping/dlsite-maniax-scraper";
import { scrapeFc2ContentMarketData } from "../../../scraping/fc2-content-market-scraper";
import { scrapeSurugayaData } from "../../../scraping/surugaya-scraper";
import { scrapeToranoanaData } from "../../../scraping/toranoana-scraper";
import { scrapeFanzaAnimeData } from "../../../scraping/fanza-anime-scraper";
import {
  staticSites,
  spaSites,
  handleAgeVerification,
  waitForSPAContent,
} from "./shared";

const allSites = [...staticSites, ...spaSites];

// Scraper functions are serialized into the page without their module scope.
// Provide module-level runtime dependencies in the browser global scope.
const injectedScraperDependencies =
  "globalThis.__scraperErrors = [];" +
  "globalThis.logger = { debug: () => {}, error: (...args) => globalThis.__scraperErrors.push(args.map((arg) => arg instanceof Error ? (arg.stack || arg.message) : String(arg)).join(' ')) };" +
  // ts-jest currently rewrites the BookWalker import to this module variable.
  // Replace this serialization shim with a real bundled ContentScript test: see the follow-up issue.
  "globalThis._halfWidth = { toHalfWidth: (value, pattern) => value.replace(pattern, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)) };";

async function runInjectedScraper<T>(
  page: Page,
  scraper: (document: Document) => T,
): Promise<T> {
  const { result, errors } = await page.evaluate(
    ({ dependencies, scraperSource }) => {
      const runScraper = new Function(
        "document",
        `${dependencies}\nreturn (${scraperSource})(document);`,
      );
      const result = runScraper(document);
      return {
        result,
        errors: (globalThis as any).__scraperErrors as string[],
      };
    },
    {
      dependencies: injectedScraperDependencies,
      scraperSource: scraper.toString(),
    },
  );

  expect(result, errors.join("\n")).toBeTruthy();
  return result as T;
}

// FANZA Video専用のスクレイピングロジックテスト
test.describe("FANZA Video Scraping Logic", () => {
  const siteConfig = spaSites.find((site) => site.service === "FANZA Video");

  test("should successfully run FANZA Video scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);

    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }

    await waitForSPAContent(page, siteConfig.selectors);

    const scrapingResult = await runInjectedScraper(page, scrapeFanzaVideoData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("video.dmm.co.jp");

    console.log(`✓ Video Title: ${scrapingResult.title}`);
    console.log(
      `✓ Video Actress: ${scrapingResult.actress ? scrapingResult.actress.join(", ") : "Not found"}`,
    );
    console.log(`✓ Video Director: ${scrapingResult.director || "Not found"}`);
    console.log(`✓ Video Label: ${scrapingResult.label || "Not found"}`);
    console.log(
      `✓ Video Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// FANZA Doujin専用のスクレイピングロジックテスト
test.describe("FANZA Doujin Scraping Logic", () => {
  const siteConfig = spaSites.find((site) => site.service === "FANZA Doujin");

  test("should successfully run FANZA Doujin scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);

    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }

    await waitForSPAContent(page, siteConfig.selectors);

    const doujinScrapingResult = await runInjectedScraper(
      page,
      scrapeFanzaDoujinData,
    );

    // 結果を検証
    expect(doujinScrapingResult.title).toBeTruthy();
    expect(doujinScrapingResult.title.length).toBeGreaterThan(0);
    expect(doujinScrapingResult.circleName).toBeTruthy();
    expect(doujinScrapingResult.url).toContain("dmm.co.jp/dc/doujin");

    console.log(`✓ Doujin Title: ${doujinScrapingResult.title}`);
    console.log(`✓ Circle Name: ${doujinScrapingResult.circleName}`);
    console.log(
      `✓ Authors: ${doujinScrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Published Date: ${doujinScrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// FANZA Books専用のスクレイピングロジックテスト
test.describe("FANZA Books Scraping Logic", () => {
  const siteConfig = spaSites.find((site) => site.service === "FANZA Books");

  test("should successfully run FANZA Books scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);

    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }

    // FANZA Booksは3秒待機が必要
    await page.waitForTimeout(3000);
    await waitForSPAContent(page, siteConfig.selectors);

    const booksScrapingResult = await runInjectedScraper(
      page,
      scrapeFanzaBooksData,
    );

    // 結果を検証
    expect(booksScrapingResult).toBeTruthy();
    expect(booksScrapingResult.title).toBeTruthy();
    expect(booksScrapingResult.title.length).toBeGreaterThan(0);
    expect(booksScrapingResult.url).toContain("book.dmm.co.jp");

    console.log(`✓ Book Title: ${booksScrapingResult.title}`);
    console.log(
      `✓ Authors: ${booksScrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(`✓ Publisher: ${booksScrapingResult.publisher || "Not found"}`);
    console.log(`✓ Label: ${booksScrapingResult.label || "Not found"}`);
    console.log(
      `✓ Published Date: ${booksScrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// Amazon scraping logic test (both English and Japanese)
test.describe("Amazon Scraping Logic", () => {
  const amazonSites = staticSites.filter((site) =>
    site.service.startsWith("Amazon"),
  );

  amazonSites.forEach((siteConfig) => {
    test(`should successfully run Amazon scraping logic - ${siteConfig.service}`, async ({
      page,
      browserName,
    }) => {
      await page.goto(siteConfig.url);
      await page.waitForLoadState("load");

      const scrapingResult = await runInjectedScraper(page, scrapeAmazonData);

      // スクレイピング結果を検証
      expect(scrapingResult).toBeTruthy();
      expect(scrapingResult.title).toBeTruthy();
      expect(scrapingResult.title.length).toBeGreaterThan(0);
      expect(scrapingResult.url).toContain("amazon.co.jp");

      console.log(`✓ Amazon Title: ${scrapingResult.title}`);
      console.log(
        `✓ Amazon Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
      );
      console.log(
        `✓ Amazon Publisher: ${scrapingResult.publisher || "Not found"}`,
      );
      console.log(
        `✓ Amazon Published Date: ${scrapingResult.publishedAt || "Not found"}`,
      );
    });
  });
});

// BookWalker scraping logic test
test.describe("BookWalker Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "BookWalker");

  test("should successfully run BookWalker scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(page, scrapeBookWalkerData);

    // スクレイピング結果を検証
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("bookwalker.jp");

    console.log(`✓ BookWalker Title: ${scrapingResult.title}`);
    console.log(
      `✓ BookWalker Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ BookWalker Publisher: ${scrapingResult.publisher || "Not found"}`,
    );
    console.log(`✓ BookWalker Label: ${scrapingResult.label || "Not found"}`);
    console.log(
      `✓ BookWalker Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// DLsite scraping logic test
test.describe("DLsite Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "DLsite");

  test("should successfully run DLsite scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(page, scrapeDLsiteData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("dlsite.com");

    console.log(`✓ DLsite Title: ${scrapingResult.title}`);
    console.log(
      `✓ DLsite Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(`✓ DLsite Circle: ${scrapingResult.circleName || "Not found"}`);
    console.log(
      `✓ DLsite Voice Actors: ${scrapingResult.voiceActors.join(", ") || "Not found"}`,
    );
    console.log(`✓ DLsite Product Type: ${scrapingResult.productType}`);
    console.log(
      `✓ DLsite Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// DLsiteBooks scraping logic test
test.describe("DLsiteBooks Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "DLsiteBooks");

  test("should successfully run DLsiteBooks scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(
      page,
      scrapeDLsiteBooksData,
    );

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("dlsite.com");

    console.log(`✓ DLsiteBooks Title: ${scrapingResult.title}`);
    console.log(
      `✓ DLsiteBooks Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ DLsiteBooks Publisher: ${scrapingResult.publisher || "Not found"}`,
    );
    console.log(`✓ DLsiteBooks Label: ${scrapingResult.label || "Not found"}`);
    console.log(
      `✓ DLsiteBooks Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// Melonbooks scraping logic test
test.describe("Melonbooks Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "Melonbooks");

  test("should successfully run Melonbooks scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(page, scrapeMelonbooksData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("melonbooks.co.jp");

    console.log(`✓ Melonbooks Title: ${scrapingResult.title}`);
    console.log(
      `✓ Melonbooks Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Melonbooks Circle: ${scrapingResult.circleName || "Not found"}`,
    );
    console.log(
      `✓ Melonbooks Genre: ${scrapingResult.genre.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Melonbooks Event: ${scrapingResult.eventName || "Not found"}`,
    );
    console.log(
      `✓ Melonbooks Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// DLsiteManiax scraping logic test
test.describe("DLsiteManiax Scraping Logic", () => {
  const siteConfig = staticSites.find(
    (site) => site.service === "DLsiteManiax",
  );

  test("should successfully run DLsiteManiax scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(
      page,
      scrapeDLsiteManiaxData,
    );

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("dlsite.com");

    console.log(`✓ DLsiteManiax Title: ${scrapingResult.title}`);
    console.log(`✓ DLsiteManiax Type: ${scrapingResult.type || "Not found"}`);
    console.log(
      `✓ DLsiteManiax Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ DLsiteManiax Circle: ${scrapingResult.circleName || "Not found"}`,
    );
    console.log(
      `✓ DLsiteManiax Voice Actors: ${scrapingResult.voiceActors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ DLsiteManiax Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// Fc2ContentMarket scraping logic test
test.describe("Fc2ContentMarket Scraping Logic", () => {
  const siteConfig = staticSites.find(
    (site) => site.service === "Fc2ContentMarket",
  );

  test("should successfully run Fc2ContentMarket scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(
      page,
      scrapeFc2ContentMarketData,
    );

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("fc2.com");

    console.log(`✓ Fc2ContentMarket Title: ${scrapingResult.title}`);
    console.log(
      `✓ Fc2ContentMarket Director: ${scrapingResult.director || "Not found"}`,
    );
    console.log(`✓ Fc2ContentMarket ID: ${scrapingResult.id || "Not found"}`);
    console.log(
      `✓ Fc2ContentMarket Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// Surugaya scraping logic test
test.describe("Surugaya Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "Surugaya");

  test("should successfully run Surugaya scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(page, scrapeSurugayaData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("suruga-ya.jp");

    console.log(`✓ Surugaya Title: ${scrapingResult.title}`);
    console.log(
      `✓ Surugaya Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Surugaya Publisher: ${scrapingResult.publisher || "Not found"}`,
    );
    console.log(
      `✓ Surugaya Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// Toranoana scraping logic test
test.describe("Toranoana Scraping Logic", () => {
  const siteConfig = staticSites.find((site) => site.service === "Toranoana");

  test("should successfully run Toranoana scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);
    await page.waitForLoadState("load");

    const scrapingResult = await runInjectedScraper(page, scrapeToranoanaData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("toranoana.jp");

    console.log(`✓ Toranoana Title: ${scrapingResult.title}`);
    console.log(
      `✓ Toranoana Authors: ${scrapingResult.authors.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Toranoana Circle: ${scrapingResult.circleName || "Not found"}`,
    );
    console.log(
      `✓ Toranoana Genre: ${scrapingResult.genre.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ Toranoana Event: ${scrapingResult.eventName || "Not found"}`,
    );
    console.log(
      `✓ Toranoana Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});

// FANZA Anime scraping logic test
test.describe("FANZA Anime Scraping Logic", () => {
  const siteConfig = spaSites.find((site) => site.service === "FANZA Anime");

  test("should successfully run FANZA Anime scraping logic", async ({
    page,
    browserName,
  }) => {
    if (!siteConfig) return;

    await page.goto(siteConfig.url);

    if (siteConfig.hasAgeVerification) {
      await handleAgeVerification(page);
    }

    await waitForSPAContent(page, siteConfig.selectors);

    const scrapingResult = await runInjectedScraper(page, scrapeFanzaAnimeData);

    // スクレイピング結果を検証
    expect(scrapingResult).toBeTruthy();
    expect(scrapingResult.title).toBeTruthy();
    expect(scrapingResult.title.length).toBeGreaterThan(0);
    expect(scrapingResult.url).toContain("dmm.co.jp");

    console.log(`✓ FANZA Anime Title: ${scrapingResult.title}`);
    console.log(
      `✓ FANZA Anime Actress: ${scrapingResult.actress.join(", ") || "Not found"}`,
    );
    console.log(
      `✓ FANZA Anime Director: ${scrapingResult.director || "Not found"}`,
    );
    console.log(`✓ FANZA Anime Label: ${scrapingResult.label || "Not found"}`);
    console.log(`✓ FANZA Anime ID: ${scrapingResult.id || "Not found"}`);
    console.log(
      `✓ FANZA Anime Manufacturer Product Number: ${scrapingResult.manufacturerProductNumber || "Not found"}`,
    );
    console.log(
      `✓ FANZA Anime Published Date: ${scrapingResult.publishedAt || "Not found"}`,
    );
  });
});
