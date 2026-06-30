# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Commands

```bash
mise install                   # Install pinned Node.js and npm
npm install                    # Install dependencies
npm run build                  # Production build
npm run dev                    # Development build
npm run fmt                    # Format TypeScript/TSX/SCSS

# Tests (t-wada test sizes — ADR-001)
npm test                       # PR-safe: Small tests only
npm run test:pr                # Same as npm test
npm run test:small             # Jest Small tests
npm run test:all               # Small -> Large, explicitly includes external sites
npm run test:large             # Playwright external site monitoring
npm run test:large:global      # External sites that do not require Japan IP
npm run test:large:japan       # External sites that require Japan IP / VPN
npm run test:failed-only       # Re-run extracted failed Large tests
```

## Architecture

uni is a Chrome / Firefox browser extension that creates Cosense pages from product pages across several EC and media sites.

Core flow: site-specific ContentScript reads the product page DOM -> scraper / Product classes normalize metadata -> UI bar lets the user create a Cosense page through the Scrapbox API.

Browser-specific manifest differences are handled through webpack and `wext-manifest-loader`.

## Test Strategy

Follow [TEST_STRATEGY.md](TEST_STRATEGY.md) and [docs/adr/001-test-strategy-and-tdd.md](docs/adr/001-test-strategy-and-tdd.md).

- Small (`src/__tests__/small/`): no network, no filesystem, no real browser. Use Jest for pure logic such as Product placeholder expansion, title normalization, popup normalization, and scraper parsing that can run against mocked Document / Element fixtures.
- Medium (`src/__tests__/medium/`): currently not adopted. Use only for localhost / fixture / real-browser integration without real external sites.
- Large (`src/__tests__/large/`): real external sites, Playwright, VPN, regional behavior, age checks, and site structure monitoring. Do not treat Large as PR-safe.
- TDD (Red-Green-Refactor): apply to pure logic and local integration logic. For scraper fixes, inspect the real HTML first, then push the reproducible logic left into Small when practical.
- Avoid speculative selectors and unnecessary fallbacks. If a site structure changes, the Large monitoring test should fail loudly enough to investigate.

## CI

- `.github/workflows/test.yml` runs Prettier check and Small tests for fast feedback.
- `.github/workflows/daily-tests.yml` runs Large monitoring tests, including Japan-IP tests through VPN.
- `.github/workflows/debug-ci-environment.yml` is for targeted manual debugging of CI / regional DOM differences.

## Pull Requests

Before opening or updating a PR, run `npm run fmt` and `npm test`. Run targeted Large tests only when the change touches scraping, selectors, age verification, or site-specific ContentScripts.

When creating and merging PRs from Codex:

- Use `gh` as the reliable path for PR creation and merge. The GitHub connector may fail to create PRs with `Resource not accessible by integration` even after the branch has been pushed.
- In the Codex sandbox, non-escalated `gh` commands that call the GitHub API can fail with DNS errors or misleading auth errors. Retry the actual API command with network escalation before concluding authentication is broken.
- Prefer this flow after committing and pushing:
  1. Create a Markdown body file under `/private/tmp`.
  2. Run `gh pr create --repo motoso/uni --base main --head <branch> --title "<title>" --body-file /private/tmp/<body>.md`.
  3. Confirm state with `gh pr view <number> --repo motoso/uni --json number,state,mergeable,isDraft,headRefOid,url`.
  4. Check CI with `gh pr checks <number> --repo motoso/uni`.
  5. Merge with `gh pr merge <number> --repo motoso/uni --merge --delete-branch` only after checks pass, or when the user explicitly says to ignore a known failing check.
