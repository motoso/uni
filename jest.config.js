module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "extensionsToTreatAsEsm": [".ts"],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)",
        "!**/monitoring.test.ts", // Exclude old monitoring test
        "!**/__tests__/medium/**/*.+(ts|tsx|js)" // Exclude medium tests (Playwright)
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                "useESM": true,
                "tsconfig": "tsconfig.jest.json"
            }
        ]
    },
    "moduleNameMapper": {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^webextension-polyfill$": "<rootDir>/src/__mocks__/webextension-polyfill.ts"
    },
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
    "projects": [
        {
            "displayName": "small",
            "roots": ["<rootDir>/src"],
            "testMatch": ["**/__tests__/small/**/*.test.(ts|js)"],
            "extensionsToTreatAsEsm": [".ts"],
            "transform": {
                "^.+\\.(ts|tsx)$": [
                    "ts-jest",
                    {
                        "useESM": true,
                        "tsconfig": "tsconfig.jest.json"
                    }
                ]
            },
            "moduleNameMapper": {
                "^(\\.{1,2}/.*)\\.js$": "$1",
                "^webextension-polyfill$": "<rootDir>/src/__mocks__/webextension-polyfill.ts"
            },
            "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
        }
    ]
}
