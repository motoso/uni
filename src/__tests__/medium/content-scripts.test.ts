import { resolve } from "node:path";
import { chromium, expect, test } from "@playwright/test";
import {
  bookWalkerHtml,
  fanzaVideoHtml,
} from "../small/scraping/fixtures/real-html";

const extensionPath = resolve("dist/chrome-mv3");

const products = [
  {
    site: "BookWalker",
    url: "https://bookwalker.jp/defb2e0181-c515-4443-9039-11b07c68a30b/",
    html: bookWalkerHtml,
    title: "生徒会にも穴はある！（8）",
    query: "生徒会にも穴はある 8",
    dynamic: false,
  },
  {
    site: "FANZA Video",
    url: "https://video.dmm.co.jp/av/content/?id=apns00240",
    html: fanzaVideoHtml,
    title: "堕とされた巨乳若女将 姫咲はな",
    query: "堕とされた巨乳若女将 姫咲はな",
    dynamic: true,
  },
];

for (const { site, url, html, title, query, dynamic } of products) {
  test(`${site} renders the bar through the built extension`, async () => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      const worker =
        context.serviceWorkers()[0] ??
        (await context.waitForEvent("serviceworker"));
      await worker.evaluate((expectedQuery) => {
        // Keep the runtime message and its background handler on the production path.
        globalThis.fetch = async (input) => {
          const request = new URL(String(input));
          if (
            request.origin !== "https://scrapbox.io" ||
            request.searchParams.get("q") !== expectedQuery
          ) {
            throw new Error(`Unexpected Cosense request: ${request}`);
          }
          return Response.json({
            count: 0,
            pages: [],
            searchQuery: [expectedQuery],
          });
        };
      }, query);

      await context.route("**/*", (route) => {
        if (route.request().url() !== url) return route.abort();
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: dynamic
            ? "<!doctype html><html><body><header></header></body></html>"
            : html,
        });
      });

      const page = await context.newPage();
      await page.goto(url);
      const bar = page.locator("#uniBarRoot");
      if (dynamic) {
        // Let the document_idle content script attempt its first scrape on the empty shell.
        await expect(bar).not.toBeAttached();
        await page.waitForTimeout(500);
        await page.evaluate((productHtml) => {
          const product = new DOMParser().parseFromString(
            productHtml,
            "text/html",
          );
          document.body.append(...product.body.childNodes);
        }, html);
      }

      await expect(
        bar.getByRole("link", { name: `${title} のページを作る` }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
}
