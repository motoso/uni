# Project instructions

## Project

uni is a Chrome / Firefox extension that creates Cosense pages from product pages.
Site-specific entrypoints in `entrypoints/` use `src/contentScript/` and
`src/scraping/` to read the DOM; Product classes normalize metadata for the UI
and Scrapbox integration.

WXT builds both browsers. Browser-specific manifest settings live in
`wxt.config.ts`; manifests under `dist/` are generated output.

## Local development

Use the Node.js and npm versions pinned in `.mise.toml` (`mise install`).
Install dependencies with `npm ci`.

- `npm run dev`: Chrome development server; `npm run dev:firefox` for Firefox.
- `npm run build`: Chrome production build; `npm run build:firefox` for Firefox.
- `npm run fmt`: format TypeScript / TSX / SCSS before committing changes to them.
- `npm test`: Small tests only, with no network, filesystem, or real browser.
- `npm run dep:check`: architecture dependency boundaries.

For logic changes, use Small tests and Red-Green-Refactor. When adding or
changing tests, use [TEST_STRATEGY.md](TEST_STRATEGY.md) for size boundaries and
commands; [ADR-001](docs/adr/001-test-strategy-and-tdd.md) explains the rationale.
Local Small tests can be run and failures caused by the change fixed without
asking for approval at each step.

For scraper, selector, age-check, or site-specific ContentScript changes,
inspect real HTML before changing selectors and run targeted Large tests.
Turn reproducible parsing bugs into Small fixtures where practical. Avoid
speculative selectors and unnecessary fallbacks that hide site changes.
Large tests contact external sites and are not the standard PR check.

## Task-specific guidance

- PR creation, updates, merges, or releases: use the [uni-delivery skill](.claude/skills/uni-delivery/SKILL.md).
- External-site monitoring failures or CI/local DOM differences: read [monitoring and IP restrictions](docs/monitoring-ip-block-limitation.md).
- Changes to `main` go through a PR; do not push directly to it.
