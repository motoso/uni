/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: "no-circular",
            severity: "error",
            comment:
                "Circular dependencies make refactoring order and ownership unclear.",
            from: {},
            to: {
                circular: true,
            },
        },
        {
            name: "no-unresolved",
            severity: "error",
            comment: "Dependencies must resolve in CI.",
            from: {},
            to: {
                couldNotResolve: true,
            },
        },
        {
            name: "background-must-not-import-ui-or-products",
            severity: "error",
            comment:
                "The background script owns extension I/O and Scrapbox search only. Product instances stay in content scripts.",
            from: {
                path: "^src/eventPage\\.ts$",
            },
            to: {
                path: [
                    "^src/(Product|Book|Doujinshi|Film|Asmr|DLsiteProduct)\\.ts$",
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                    "^src/scraping/",
                ],
            },
        },
        {
            name: "scrapers-stay-pure-adapters",
            severity: "error",
            comment:
                "Scrapers should remain Document -> ScrapedData adapters and must not know products, UI, extension APIs, or Scrapbox.",
            from: {
                path: "^src/scraping/",
            },
            to: {
                path: [
                    "^src/(Product|Book|Doujinshi|Film|Asmr|DLsiteProduct|chromeApi|eventPage)\\.ts$",
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                    "^src/scrapbox/",
                ],
            },
        },
        {
            name: "sites-must-stay-framework-independent",
            severity: "error",
            comment:
                "Site definitions may compose scrapers and product factories, but must not depend on extension runtime or presentation code.",
            from: {
                path: "^src/sites/",
            },
            to: {
                path: [
                    "^src/(chromeApi|eventPage)\\.ts$",
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                ],
            },
        },
        {
            name: "sites-must-not-import-ui-or-extension-packages",
            severity: "error",
            comment:
                "Framework-independent site definitions must remain free of UI and browser-extension runtime packages.",
            from: {
                path: "^src/sites/",
            },
            to: {
                dependencyTypes: ["npm"],
                path: ["^react$", "^react-dom", "^webextension-polyfill$"],
            },
        },
        {
            name: "products-must-not-import-storage-keys",
            severity: "error",
            comment:
                "Product family holds data + pure Scrapbox body formatting. Storage reads live in callers (see src/settings), so products must not import the storage-key module nor the settings readers (which would reintroduce storage access transitively).",
            from: {
                path: "^src/(Product|Book|Doujinshi|Film|Asmr|DLsiteProduct)\\.ts$",
            },
            to: {
                path: ["^src/chromeApi\\.ts$", "^src/settings/"],
            },
        },
        {
            name: "products-must-not-import-extension-runtime",
            severity: "error",
            comment:
                "Product family must stay browser-free; storage/runtime access belongs to callers.",
            from: {
                path: "^src/(Product|Book|Doujinshi|Film|Asmr|DLsiteProduct)\\.ts$",
            },
            to: {
                dependencyTypes: ["npm"],
                path: ["^webextension-polyfill$"],
            },
        },
        {
            name: "domain-must-stay-browser-free",
            severity: "error",
            comment:
                "Future src/domain code is pure domain logic. Browser, UI, storage, network, and transport code must stay outside.",
            from: {
                path: "^src/domain/",
            },
            to: {
                path: [
                    "^src/chromeApi\\.ts$",
                    "^src/eventPage\\.ts$",
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                    "^src/scrapbox/",
                    "^src/infrastructure/",
                ],
            },
        },
        {
            name: "domain-must-not-import-runtime-packages",
            severity: "error",
            comment:
                "Future src/domain code must not import UI, extension runtime, HTTP clients, or date libraries.",
            from: {
                path: "^src/domain/",
            },
            to: {
                dependencyTypes: ["npm"],
                path: [
                    "^react$",
                    "^react-dom",
                    "^ky$",
                    "^webextension-polyfill$",
                    "^dayjs$",
                ],
            },
        },
        {
            name: "usecase-must-not-depend-on-presentation-or-infrastructure",
            severity: "error",
            comment:
                "Future usecases may depend on domain and ports, but not on presentation or concrete infrastructure.",
            from: {
                path: "^src/usecase/",
            },
            to: {
                path: [
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                    "^src/infrastructure/",
                ],
            },
        },
        {
            name: "usecase-must-not-import-runtime-packages",
            severity: "error",
            comment:
                "Future usecases should depend on ports, not concrete UI, extension runtime, or HTTP packages.",
            from: {
                path: "^src/usecase/",
            },
            to: {
                dependencyTypes: ["npm"],
                path: [
                    "^react$",
                    "^react-dom",
                    "^ky$",
                    "^webextension-polyfill$",
                ],
            },
        },
        {
            name: "ports-must-stay-abstract",
            severity: "error",
            comment:
                "Future ports define interfaces only and must not depend on concrete extension, network, or UI implementations.",
            from: {
                path: "^src/ports/",
            },
            to: {
                path: [
                    "^src/chromeApi\\.ts$",
                    "^src/eventPage\\.ts$",
                    "^src/contentScript/",
                    "^src/organism/",
                    "^src/popup/",
                    "^src/infrastructure/",
                ],
            },
        },
        {
            name: "ports-must-not-import-runtime-packages",
            severity: "error",
            comment:
                "Future ports define interfaces only and must not import concrete UI, extension runtime, or HTTP packages.",
            from: {
                path: "^src/ports/",
            },
            to: {
                dependencyTypes: ["npm"],
                path: [
                    "^react$",
                    "^react-dom",
                    "^ky$",
                    "^webextension-polyfill$",
                ],
            },
        },
    ],
    options: {
        doNotFollow: {
            path: [
                "node_modules",
                "\\.git",
                "dist",
                "coverage",
                "test-results",
                "playwright-report",
            ],
        },
        exclude: {
            path: [
                "node_modules",
                "dist",
                "coverage",
                "test-results",
                "playwright-report",
                "\\.test\\.",
                "\\.spec\\.",
                "__tests__",
            ],
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: "tsconfig.json",
        },
        enhancedResolveOptions: {
            exportsFields: ["exports"],
            conditionNames: ["import", "require", "browser", "node", "default"],
            extensions: [".js", ".json", ".node", ".ts", ".tsx"],
        },
    },
};
