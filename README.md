# Uni
[Project page](https://scrapbox.io/motoso/Uni%EF%BC%9AScrapbox%E3%81%A7%E3%81%AE%E8%94%B5%E6%9B%B8%E7%AE%A1%E7%90%86%E3%82%92%E6%94%AF%E6%8F%B4%E3%81%99%E3%82%8BChrome%E6%8B%A1%E5%BC%B5)

## プロジェクト概要

Uniは、さまざまな書籍・同人誌・動画サイトから情報を収集し、Cosenseで蔵書管理をするためのWebブラウザ拡張機能です。**Chrome** と **Firefox** に対応しています。

### 対応サービス

#### 書籍サービス
- FANZA
- DLsite
- Amazon
- Book Walker

#### 同人誌サービス
- とらのあな
- メロンブックス
- 駿河屋
- DLsiteManiax
- FANZA（同人）

#### 動画サービス
- FANZA（動画）
- FANZA（アニメ）
- FC2コンテンツマーケット

### 機能

- 対応サイトで商品ページを開くと、自動的にその商品情報（タイトル、著者など）を取得
- Cosenseの指定プロジェクトで、同じ商品が登録されているか検索
- 既に登録されている場合は、そのページへのリンクを表示
- 登録されていない場合は、新規ページ作成用のリンクを表示

## 使い方

1. 拡張機能のポップアップからCosenseのプロジェクト名を設定します
2. 対応サービスの商品ページにアクセスすると、ページ上部にバーが表示されます
3. 同じ商品がCosenseに登録されていれば、そのページへのリンクが表示されます
4. 登録されていなければ、新規ページ作成用のリンクが表示されます

### Cosenseページフォーマットのカスタマイズ

拡張機能のポップアップで、Cosenseに保存するページのフォーマットを自由に設定できます。以下の変数が利用可能です。

- `{title}`: 商品のタイトル
- `{authors}`: 著者名（複数いる場合はスペース区切りでリンク形式）
- `{service}`: サービス名（例: FANZA, Amazon）
- `{url}`: 商品ページのURL
- `{publishedYear}`: 発行年
- `{publishedMonth}`: 発行月
- `{publishedDate}`: 発行日

**例:**
```
[{service}で読む {url}]
[[著者]]：{authors}
[[概要]]：
[[発行年]]：{publishedYear}/{publishedMonth}/{publishedDate}
```

## Browser Support

この拡張機能は以下のブラウザに対応しています：

- **Google Chrome** (Manifest V3)
- **Mozilla Firefox** (Manifest V3 with Event Pages)

## Building

### 基本のビルド方法

1.  Clone repo
2.  `mise install`
3.  `npm i`
4.  開発用: `npm run dev` または `npm run watch`
5.  本番用: `npm run build`

### ブラウザ別ビルド

Chrome と Firefox で異なる実装が必要なため、ブラウザ別のビルドコマンドを用意しています：

```bash
# Chrome用ビルド
npm run build:chrome
npm run dev:chrome
npm run watch:chrome

# Firefox用ビルド  
npm run build:firefox
npm run dev:firefox
npm run watch:firefox
```

### 配布用パッケージング

各ブラウザストア向けのZIPファイルを自動生成：

```bash
# Chrome用ZIPパッケージ作成
npm run package:chrome    # → dist/uni-chrome.zip

# Firefox用ZIPパッケージ作成  
npm run package:firefox   # → dist/uni-firefox.zip

# 両方同時作成
npm run package:all
```

ビルド結果は以下のディレクトリ構造で出力されます：
```
dist/
├── chrome-mv3/    # Chrome用ビルド
├── firefox-mv3/   # Firefox用ビルド
└── *.zip          # ストア配布用パッケージ
```

## Installation

### Google Chrome

1.  `npm run build:chrome` でChromeビルドを実行
2.  [chrome://extensions](chrome://extensions) を開く
3.  「デベロッパーモード」を有効にする
4.  「パッケージ化されていない拡張機能を読み込む」で `dist/chrome-mv3` フォルダを選択

### Mozilla Firefox

1.  `npm run build:firefox` でFirefoxビルドを実行
2.  [about:debugging](about:debugging) を開く
3.  「この Firefox」→「一時的なアドオンを読み込む」
4.  `dist/firefox-mv3` フォルダ内の `manifest.json` を選択

### ストア配布用

配布用ZIPファイルを作成：
```bash
npm run package:chrome   # Chrome Web Store用
npm run package:firefox  # Firefox Add-ons用
```

Chrome Web StoreへのアップロードとOAuth認証情報の更新については、[Chrome Web Storeリリース手順](docs/chrome-web-store-release.md)を参照してください。

## Technical Details

### Browser Differences

この拡張機能はWXTを使用し、`wxt.config.ts` と `entrypoints/` からブラウザ別のmanifestを生成します：

**Chrome (Manifest V3)**
- `action` フィールドを使用
- `background.service_worker` でService Worker実行

**Firefox (Manifest V3)**  
- `action` フィールドを使用
- `background.scripts` でEvent Pages実行

### Cross-browser API Compatibility

`webextension-polyfill` を使用してブラウザAPI間の互換性を確保しています。

## Testing & Debugging

### Test Commands

- `npm run test:small` - Unit tests (Jest)
- `npm test` / `npm run test:pr` - PR-safe tests (Small only)
- `npm run test:all` - Small + Large tests
- `npm run test:large` - External site monitoring tests (both Japan and Global sites)
- `npm run test:large:japan` - Japan-restricted external site tests requiring Japan IP (FANZA, Amazon)
- `npm run test:large:global` - Global-accessible external site tests (BookWalker, DLsite, etc.)

See [TEST_STRATEGY.md](TEST_STRATEGY.md) for the t-wada test-size strategy and TDD policy. Large tests touch real external sites and may fail due to geographic restrictions, site-side bot detection, or temporary network conditions.

### Failed Test Selective Re-execution (Local Development)

For efficient local development, you can selectively re-run only the tests that failed in CI instead of running the entire test suite:

#### Recommended Workflow
```bash
# 1. Extract failed tests from latest CI failure (requires GitHub CLI)
npm run test:extract-failed-from-ci

# 2. Or specify a specific CI run ID
npm run test:extract-failed-from-ci [RUN_ID]

# 3. Run only the failed tests locally
npm run test:failed-only

# 4. Fix issues and commit - PR CI runs Small tests; Daily CI monitors external sites
```

#### Alternative: Manual Log Extraction
```bash
# If you have a CI failure log file saved locally
npm run test:extract-failed ci-log.txt

# Or extract from current local test run (script provides sample patterns)
npm run test:extract-failed

# Then run only failed tests
npm run test:failed-only
```

#### Requirements
- **GitHub CLI**: Install with `gh auth login` for CI log extraction
- **Local Development Only**: Failed-test extraction selects Large tests for targeted reruns

#### How It Works
- `scripts/extract-from-ci.js` fetches CI failure logs via GitHub CLI
- `scripts/extract-failed-tests.js` parses Playwright output and extracts failed test names
- Failed test patterns are saved to `failed-tests-patterns.txt`
- `npm run test:failed-only` reads these patterns and runs only matching tests
- **CI**: PR CI runs Small tests, formatting, dependency checks, and a Chrome build; Daily CI runs Large monitoring tests

### CI Environment vs Local Environment

外部サイト監視でCIと手元の結果が異なる場合は、
[監視のIP制限・DOM調査・VPN設定](docs/monitoring-ip-block-limitation.md)を参照してください。
対象サイトを絞った調査には [Debug CI Environment](.github/workflows/debug-ci-environment.yml)、
日本VPNを含む監視には [Daily Tests](.github/workflows/daily-tests.yml) を使用します。

### 開発エージェント向けの指示

共通指示は [AGENTS.md](AGENTS.md)、PR・リリース時の手順は
[uni-deliveryスキル](.claude/skills/uni-delivery/SKILL.md)を参照してください。
スキルの実体は `.claude/skills/uni-delivery/`、Codex用の
`.agents/skills/uni-delivery` はそこへのシンボリックリンクです。
