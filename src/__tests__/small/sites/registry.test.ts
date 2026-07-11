import { productSiteRegistry } from "../../../sites/registry";

describe("productSiteRegistry", () => {
  it("keeps every product-site id and content-script entry unique", () => {
    const ids = productSiteRegistry.map(({ id }) => id);
    const entries = productSiteRegistry.map(
      ({ contentScriptEntry }) => contentScriptEntry,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(entries).size).toBe(entries.length);
  });

  it("provides routing and runtime adapters for every product site", () => {
    for (const site of productSiteRegistry) {
      expect(site.hosts.length).toBeGreaterThan(0);
      expect(site.matches.length).toBeGreaterThan(0);
      expect(site.productTypes.length).toBeGreaterThan(0);
      expect(typeof site.scraper).toBe("function");
      expect(typeof site.createProduct).toBe("function");
      for (const match of site.matches) {
        expect(match).toMatch(/^https:\/\//);
        expect(site.hosts.some((host) => match.includes(host))).toBe(true);
      }
    }
  });

  it("covers the current product content-script entries", () => {
    expect(
      productSiteRegistry.map(({ contentScriptEntry }) => contentScriptEntry),
    ).toEqual([
      "fanzaBooks",
      "fanzaDoujin",
      "fanzaVideo",
      "fanzaAnime",
      "dlsite",
      "dlsiteManiax",
      "toranoana",
      "melonbooks",
      "amazon",
      "bookWalker",
      "fc2ContentMarket",
      "surugaya",
    ]);
  });

  it("uses entry names that map directly to WXT content entrypoints", () => {
    for (const { contentScriptEntry } of productSiteRegistry) {
      expect(contentScriptEntry).toMatch(/^[a-z][A-Za-z0-9]*$/);
    }
  });
});
