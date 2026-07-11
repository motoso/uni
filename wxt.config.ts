import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: ".",
  publicDir: "public",
  outDir: "dist",
  manifest: ({ browser }) => ({
    name: "Uni",
    description: "Building your library on the Cosense",
    version: "2.1.4",
    icons: {
      16: "icon16.png",
      48: "icon48.png",
      128: "icon128.png",
    },
    permissions:
      browser === "firefox" ? ["storage"] : ["declarativeContent", "storage"],
    host_permissions: ["https://scrapbox.io/api/*"],
    browser_specific_settings:
      browser === "firefox"
        ? {
            gecko: {
              id: "uni@motosono.dev",
              data_collection_permissions: {
                required: ["websiteContent"],
                optional: ["technicalAndInteraction"],
              },
            },
            gecko_android: {},
          }
        : undefined,
  }),
});
