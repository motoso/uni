import { test, expect } from "@playwright/test";
import { scrapeMgstageData } from "../../../scraping/mgstage-scraper";

const products = [
  { id: "ONECOIN-MEGGHIT021", actors: [], label: "", date: "2023-01-01" },
  {
    id: "300MIUM-001",
    actors: ["めぐみさん 24歳 受付嬢"],
    label: "prestigepremium",
    date: "2017-01-07",
  },
];

test.describe("@japan MGS動画", () => {
  for (const product of products) {
    test(`scrapes ${product.id} and provides the bar insertion target`, async ({
      page,
    }) => {
      const url = `https://www.mgstage.com/product/product_detail/${product.id}/`;
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(response?.ok()).toBe(true);

      // The observed age gate stays on the product URL and has no product title.
      const acceptAge = page.locator("#AC");
      if (await acceptAge.isVisible()) {
        const gated = await page.evaluate((source) => {
          return new Function("document", `return (${source})(document)`)(
            document,
          );
        }, scrapeMgstageData.toString());
        expect(gated).toBeNull();
        await acceptAge.click();
      }
      await expect(page.locator(".common_detail_cover h1.tag")).toBeVisible();
      await expect(page.locator("#header")).toHaveCount(1);

      const data = await page.evaluate((source) => {
        return new Function("document", `return (${source})(document)`)(
          document,
        );
      }, scrapeMgstageData.toString());
      expect(data).toMatchObject({
        url,
        id: product.id,
        actors: product.actors,
        label: product.label,
      });
      expect(data.title.length).toBeGreaterThan(0);
      expect(new Date(data.publishedAt).toISOString().slice(0, 10)).toBe(
        product.date,
      );
    });
  }
});
