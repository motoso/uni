import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const outputPath = "src/__tests__/small/scraping/fixtures/real-html.ts";

const sites = [
    {
        exportName: "bookWalkerHtml",
        service: "BookWalker",
        url: "https://bookwalker.jp/defb2e0181-c515-4443-9039-11b07c68a30b/",
        selectors: ["h1", ".t-c-product-main-data__authors"],
        fixtureSelectors: ["h1", "dl"],
    },
    {
        exportName: "dlsiteBooksHtml",
        service: "DLsiteBooks",
        url: "https://www.dlsite.com/books/work/=/product_id/BJ02112599.html",
        selectors: ["#work_name", "#work_maker", "#work_outline"],
        fixtureSelectors: ["#work_name", "#work_maker", "#work_outline"],
    },
    {
        exportName: "dlsiteManiaxHtml",
        service: "DLsiteManiax",
        url: "https://www.dlsite.com/maniax/work/=/product_id/RJ01341329.html",
        selectors: ["#work_name", "#work_maker", "#work_outline"],
        fixtureSelectors: ["#work_name", "#work_maker", "#work_outline"],
    },
    {
        exportName: "fanzaBooksHtml",
        service: "FANZA Books",
        url: "https://book.dmm.co.jp/product/4425627/b425aakkg00576/",
        selectors: ["h1"],
        fixtureSelectors: ["dl"],
    },
    {
        exportName: "fanzaDoujinHtml",
        service: "FANZA Doujin",
        url: "https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=d_335698/",
        selectors: [".productTitle__txt"],
        fixtureSelectors: [
            ".productTitle__txt",
            ".circleName__txt",
            ".productInformation__item",
        ],
    },
    {
        exportName: "fanzaVideoHtml",
        service: "FANZA Video",
        url: "https://video.dmm.co.jp/av/content/?id=apns00240",
        selectors: ["h1"],
        fixtureSelectors: ["h1", "table.text-xs.shrink"],
    },
];

const browser = await chromium.launch({ headless: true });

const captured = [];

for (const site of sites) {
    console.log(`Capturing ${site.service}: ${site.url}`);
    const context = await browser.newContext({
        locale: "ja-JP",
        userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(site.url, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
    });
    await handleAgeVerification(page);
    await waitForAnySelector(page, site.selectors, site.service);
    await page.waitForTimeout(1500);

    captured.push({
        exportName: site.exportName,
        service: site.service,
        url: page.url(),
        html: await captureFixtureHtml(page, site.fixtureSelectors),
    });

    await context.close();
}

await browser.close();

const body = [
    "// Generated from real product pages by scripts/capture-real-scraper-fixtures.mjs.",
    "// Do not hand-edit fixture contents; regenerate when intentionally updating scraper snapshots.",
    "",
    ...captured.flatMap(({ exportName, service, url, html }) => [
        `// ${service}: ${url}`,
        `export const ${exportName} = ${JSON.stringify(html)};`,
        "",
    ]),
].join("\n");

await writeFile(outputPath, body);
console.log(`Wrote ${outputPath}`);

async function handleAgeVerification(page) {
    const ageSelectors = [
        "text=Agree",
        "text=I Agree",
        "text=Yes",
        'button:has-text("Agree")',
        'button:has-text("I Agree")',
        'button:has-text("Yes")',
        'a:has-text("Agree")',
        'a:has-text("I Agree")',
        'a:has-text("Yes")',
        "text=はい",
        'button:has-text("はい")',
        'input[value="はい"]',
        'a:has-text("はい")',
    ];

    for (const selector of ageSelectors) {
        const target = page.locator(selector).first();
        if (await target.isVisible({ timeout: 1000 }).catch(() => false)) {
            await target.click();
            await page
                .waitForURL(
                    (url) =>
                        !url.href.includes("age_check") &&
                        !url.href.includes("login"),
                    { timeout: 30000 },
                )
                .catch(() => undefined);
            await page
                .waitForLoadState("domcontentloaded", { timeout: 30000 })
                .catch(() => undefined);
            await page.waitForTimeout(3000);
            return;
        }
    }
}

async function waitForAnySelector(page, selectors, service) {
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
        for (const selector of selectors) {
            if (
                (await page
                    .locator(selector)
                    .count()
                    .catch(() => 0)) > 0
            ) {
                return;
            }
        }
        await page.waitForTimeout(500);
    }

    console.error(`Failed while capturing ${service}`);
    console.error(`Current URL: ${page.url()}`);
    console.error(`Title: ${await page.title().catch(() => "")}`);
    for (const selector of selectors) {
        console.error(
            `${selector}: ${await page
                .locator(selector)
                .count()
                .catch(() => -1)}`,
        );
    }
    console.error(
        (
            await page
                .locator("body")
                .innerText()
                .catch((error) => String(error))
        ).slice(0, 1200),
    );
    throw new Error(`Timed out waiting for selectors: ${selectors.join(", ")}`);
}

async function captureFixtureHtml(page, selectors) {
    const fragments = await page.evaluate((selectorList) => {
        const seen = new Set();
        return selectorList.flatMap((selector) =>
            Array.from(document.querySelectorAll(selector))
                .map((element) => element.outerHTML)
                .filter((html) => {
                    if (seen.has(html)) return false;
                    seen.add(html);
                    return true;
                }),
        );
    }, selectors);

    return `<!DOCTYPE html><html><body>${fragments.join("\n")}</body></html>`;
}
