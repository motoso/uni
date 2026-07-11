import manifest from "../../../manifest.json";
import { siteRegistry } from "../../../sites/registry";

describe("site registry", () => {
  it("covers every manifest content script without match-pattern drift", () => {
    const registryScripts = Object.values(siteRegistry).map((site) => ({
      matches: [...site.matches],
      js: [`js/${site.contentScriptOutput}.js`],
    }));

    expect(registryScripts).toEqual(manifest.content_scripts);
  });

  it("keeps required site metadata complete", () => {
    for (const site of Object.values(siteRegistry)) {
      expect(site.service).not.toBe("");
      expect(site.hosts.length).toBeGreaterThan(0);
      expect(site.matches.length).toBeGreaterThan(0);
      expect(site.productTypes.length).toBeGreaterThan(0);
      expect(site.productFactory).not.toBe("");
      expect(site.contentScriptEntry).toMatch(/^contentScript\/.+\.tsx$/);

      for (const match of site.matches) {
        expect(site.hosts).toContain(new URL(match.replace("*", "x")).host);
      }
    }
  });
});
