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
2.  `npm i`
3.  開発用: `npm run dev` または `npm run watch`
4.  本番用: `npm run build`

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
npm run package:chrome    # → uni-chrome.zip

# Firefox用ZIPパッケージ作成  
npm run package:firefox   # → uni-firefox.zip

# 両方同時作成
npm run package:all
```

ビルド結果は以下のディレクトリ構造で出力されます：
```
dist/
├── chrome/        # Chrome用ビルド
├── firefox/       # Firefox用ビルド
└── *.png         # アイコンファイル
```

## Installation

### Google Chrome

1.  `npm run build:chrome` でChromeビルドを実行
2.  [chrome://extensions](chrome://extensions) を開く
3.  「デベロッパーモード」を有効にする
4.  「パッケージ化されていない拡張機能を読み込む」で `dist/chrome` フォルダを選択

### Mozilla Firefox

1.  `npm run build:firefox` でFirefoxビルドを実行
2.  [about:debugging](about:debugging) を開く
3.  「この Firefox」→「一時的なアドオンを読み込む」
4.  `dist/firefox` フォルダ内の `manifest.json` を選択

### ストア配布用

配布用ZIPファイルを作成：
```bash
npm run package:chrome   # Chrome Web Store用
npm run package:firefox  # Firefox Add-ons用
```

## Technical Details

### Browser Differences

この拡張機能は `wext-manifest-loader` を使用してブラウザ間の差異を吸収しています：

**Chrome (Manifest V3)**
- `action` フィールドを使用
- `background.service_worker` でService Worker実行

**Firefox (Manifest V3)**  
- `browser_action` フィールドを使用
- `background.scripts` でEvent Pages実行

### Cross-browser API Compatibility

`webextension-polyfill` を使用してブラウザAPI間の互換性を確保しています。

## Testing & Debugging

### Test Commands

- `npm run test:small` - Unit tests (Jest)
- `npm run test:medium` - All integration tests (both Japan and Global sites)
- `npm run test:medium:japan` - Japan-restricted tests requiring Japan IP (FANZA, Amazon)
- `npm run test:medium:global` - Global-accessible tests (BookWalker, DLsite, etc.)
- `npm test` - All standard tests (small + medium)

**Note**: Japan-restricted tests may fail in CI due to geographic restrictions but are still executed with `continue-on-error` for monitoring purposes.

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

# 4. Fix issues and commit - CI will run all tests for safety
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
- **Local Development Only**: CI always runs all tests to ensure no regressions

#### How It Works
- `scripts/extract-from-ci.js` fetches CI failure logs via GitHub CLI
- `scripts/extract-failed-tests.js` parses Playwright output and extracts failed test names
- Failed test patterns are saved to `failed-tests-patterns.txt`
- `npm run test:failed-only` reads these patterns and runs only matching tests
- **CI Safety**: All workflows run complete test suites to maintain reliability

### CI Environment vs Local Environment

テストが手元では成功するがCI環境で失敗する場合、地理的IP制限による内容の違いが原因の可能性があります。

#### 主な違い
- **CI環境 (GitHub Actions, Wyoming, US)**: 海外IPとして扱われ、英語コンテンツが表示される
- **手元環境 (日本)**: 日本語コンテンツが表示される

#### FANZA年齢認証の例
```typescript
// CI環境: 英語年齢認証ページ (/en/age_check/)
// ボタンテキスト: "I Agree", "Agree", "Yes"

// 手元環境: 日本語年齢認証ページ
// ボタンテキスト: "はい"
```

### CI環境でのDOMデバッグ方法

#### 1. 専用デバッグテストの作成
```bash
# 失敗しているサイトのみの詳細デバッグテストを作成
npm run test:quick  # FANZA Video, FANZA Doujin, Amazon Englishのみ実行
```

#### 2. CI設定の一時変更
`playwright.config.ts` でCI環境用の設定を調整：
```typescript
// デバッグテストのみ実行
testMatch: process.env.CI ? '**/__tests__/medium/monitoring/fanza-debug.test.ts' : '**/__tests__/medium/**/*.test.ts'
```

#### 3. GitHub Actionsログの確認
```bash
# 最新のテスト結果を確認
gh run list --limit 5

# 特定のテスト実行のログを確認
gh run view [RUN_ID] --log | grep -A 50 "🔍 Debugging"

# DOM分析結果を確認
gh run view [RUN_ID] --log | grep -A 10 "BUTTON ELEMENTS FOUND"
```

#### 4. DOM構造分析のポイント
- 実際のHTML構造の確認（想像ではなく実際のDOM）
- ボタン要素の詳細情報取得（tagName, textContent, className, id）
- セレクター試行の成功/失敗ログ
- Genericなfallbackパターンの回避（デバッグが困難になるため）

#### 5. デバッグテストの実装例
```typescript
// DOM構造の詳細分析
const buttons = await page.evaluate(() => {
  const buttonElements = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'));
  return buttonElements.map(btn => ({
    tagName: btn.tagName,
    textContent: btn.textContent?.trim() || '',
    className: btn.className,
    id: btn.id
  }));
});

console.log(`🔘 BUTTON ELEMENTS FOUND (${buttons.length}):`);
buttons.forEach((btn, idx) => {
  console.log(`   [${idx}] ${btn.tagName}: "${btn.textContent}" (class: "${btn.className}", id: "${btn.id}")`);
});
```

## Geographic IP Restrictions & CI Environment Behavior

### FANZA Sites Specific Behavior

CI環境（GitHub Actions, Wyoming, US）でのFANZAサイトアクセスには地理的制限が適用されます。

#### Access Pattern Analysis

##### 1. Age Verification Stage
- **Local Environment (Japan IP)**: Japanese age verification page with "はい" button
- **CI Environment (US IP)**: English age verification page (`/en/age_check/`) with "I Agree", "Agree" buttons

##### 2. Post-Age Verification Behavior

**Pattern A: Login Redirect (80-90% of cases in CI)**
```
Age Verification Success → https://accounts.dmm.co.jp/service/login/password/=
```
- **Cause**: Overseas IP requires additional login authentication
- **Limitation**: Product scraping not possible on login page
- **Current Status**: Incorrectly treated as "age verification failure"

**Pattern B: Direct Content Access (10-20% of cases in CI)**
```
Age Verification Success → https://video.dmm.co.jp/av/content/?id=xxxxx
```
- **Result**: Normal scraping possible
- **Status**: Works correctly with current implementation

#### Geographic Restrictions Impact

| Environment | IP Location | Age Verification | Additional Auth | Scraping Capability |
|-------------|-------------|------------------|-----------------|-------------------|
| Local | Japan | Japanese (はい) | Not required | ✅ Full access |
| CI | Wyoming, US | English (Agree) | Login required | ⚠️ Limited access |

#### Test Success Criteria Considerations

**Current Issue**: The `handleAgeVerification` function treats login pages as failures:
```typescript
if (finalUrl.includes('login')) {
  throw new Error(`Age verification failed - still on auth page: ${finalUrl}`);
}
```

**Recommended Approach**:
1. **Treat login page as partial success** - Age verification was bypassed successfully
2. **Adjust expectations for CI environment** - Geographic restrictions are normal behavior
3. **Document limitations** - Overseas IP access has inherent restrictions

#### Debugging Geographic Issues

When tests fail in CI but pass locally, check for:
1. **Language differences** in age verification pages
2. **Additional authentication requirements** for overseas IPs
3. **Different redirect behavior** based on geographic location
4. **Content availability restrictions** by region

Use the debug workflow (`.github/workflows/debug-ci-environment.yml`) to analyze:
- Actual DOM structure in CI environment
- Geographic-specific page variations
- Authentication flow differences

## VPN Integration for Japan IP Testing

### Overview

To address geographic IP restrictions in CI environments, a VPN integration has been implemented using Gluetun and ProtonVPN Free tier.

**VPN Usage Scope**: VPN is specifically used for FANZA-related tests only, as these sites display different content (Japanese vs English) based on geographic location. Other sites (Amazon, DLsite, BookWalker, etc.) provide consistent content regardless of IP location and therefore do not require VPN.

### Setup Instructions

#### 1. ProtonVPN Account Setup
1. Create a free account at [ProtonVPN](https://protonvpn.com/)
2. Navigate to Account → [WireGuard configuration](https://account.proton.me/u/0/vpn/WireGuard)
3. Generate a WireGuard configuration file
4. Copy the `PrivateKey` value from the configuration

#### 2. GitHub Secrets Configuration
Add the following secret to your GitHub repository:

```
PROTONVPN_WIREGUARD_PRIVATE_KEY: [Your WireGuard PrivateKey in base64 format]
```

#### 3. Running VPN Tests

**Manual Trigger:**
```bash
# Via GitHub Actions tab
Actions → "testing-with-vpn" → "Run workflow"
```

**Branch-based Trigger:**
```bash
# Create/push to vpn-integration branch
git checkout -b vpn-integration
git push origin vpn-integration
```

#### 4. Test Coverage
The VPN workflow specifically targets:
- **Japan-restricted tests** (`npm run test:medium:japan`):
  - FANZA Video: `video.dmm.co.jp`
  - FANZA Doujin: `dmm.co.jp/dc/doujin`
  - FANZA Books: `book.dmm.co.jp`
  - FANZA Anime: `video.dmm.co.jp/anime`
  - Amazon JP: `amazon.co.jp`
- IP verification and country detection
- Proxy connectivity validation

**Note**: Global tests (`npm run test:medium:global`) for DLsite, BookWalker, Melonbooks, etc. run in the standard CI environment without VPN, as they provide consistent content regardless of geographic location.

### Technical Implementation

#### VPN Service Configuration
```yaml
services:
  vpn:
    image: qmcgaw/gluetun
    env:
      VPN_SERVICE_PROVIDER: protonvpn
      VPN_TYPE: wireguard
      WIREGUARD_PRIVATE_KEY: ${{ secrets.PROTONVPN_WIREGUARD_PRIVATE_KEY }}
      SERVER_COUNTRIES: Japan
      FREE_ONLY: "on"
      HTTPPROXY: "on"
```

#### Playwright Proxy Configuration
Tests automatically route through the VPN using HTTP proxy:
```bash
export HTTP_PROXY=http://vpn:8888
export HTTPS_PROXY=http://vpn:8888
```

### Benefits
- **High Performance**: WireGuard protocol for faster speeds
- **Geographic Accuracy**: Tests run with Japan IP addresses
- **FANZA Compatibility**: Access Japanese age verification pages
- **Content Consistency**: Ensures Japanese content only (no English fallbacks)
- **Test Reliability**: Eliminates geographic content variations for FANZA sites
- **Cost Effective**: Uses ProtonVPN's free tier
- **CI Integration**: Automated testing without manual intervention

### Limitations
- **ProtonVPN Free**: Limited to 1 concurrent connection
- **Speed Impact**: Potential latency increase due to VPN routing
- **Dependency**: Requires external service availability
