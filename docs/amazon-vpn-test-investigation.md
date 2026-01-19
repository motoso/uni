# Amazon VPNテスト失敗の調査報告

## 概要

2026年1月15日より、CI環境でのVPNテスト（Daily Tests Large & VPN）においてAmazon (Japanese)サイトのセレクタチェックが連続して失敗している問題を調査しました。

## 問題の詳細

### 失敗しているテスト
- テストスイート: `@japan Site Monitoring - Amazon (Japanese) (Static)`
- 失敗しているセレクタ:
  - `#navbar`
  - `#productTitle`
  - `#detailBullets_feature_div`
  - `[href*='ref=dp_byline_cont_book']`

### エラーメッセージ
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  - waiting for locator('#detailBullets_feature_div')
```

## 調査プロセス

### 1. デバッグテストの作成

CI環境でのDOM構造を詳細に分析するため、`amazon-debug.test.ts`を作成しました。

**実装内容**:
- 現在のセレクタの存在確認
- 代替セレクタの探索（ナビゲーション、タイトル、詳細、著者情報）
- ページに存在する主要ID要素のリストアップ
- ボット検出/CAPTCHAの確認
- デバッグ用スクリーンショット保存

### 2. CI環境での実行結果

**実行ワークフロー**: Debug CI Environment
**実行日時**: 2026-01-16 07:46 UTC
**環境**: GitHub Actions (Wyoming, US)
**URL**: https://github.com/motoso/uni/actions/runs/21059430413

### 3. 調査結果

#### 重大な発見: CAPTCHA/ボット検出

CI環境からのアクセスは**Amazonのボット検出システムによってブロック**されていました。

**証拠**:

1. **異常に短いHTML**
   ```
   HTML Length: 5,348 characters
   ```
   - 正常な商品ページは通常数万文字
   - 実際に受信したのはCAPTCHAページ

2. **タイトルの異常**
   ```
   Title: Amazon.co.jp
   ```
   - 商品名が表示されていない
   - 通常は商品タイトルが表示される

3. **CAPTCHA関連コードの検出**
   ```javascript
   ue_sn = "opfcaptcha.amazon.co.jp"
   ```
   - HTMLに明示的なCAPTCHAドメイン
   - csm-captcha-instrumentation.min.js の読み込み

4. **全セレクタの不在**
   ```
   🔍 CHECKING CURRENT SELECTORS:
      ❌ #navbar: NOT FOUND
      ❌ #productTitle: NOT FOUND
      ❌ #detailBullets_feature_div: NOT FOUND
      ❌ [href*='ref=dp_byline_cont_book']: NOT FOUND

   🔎 SEARCHING FOR ALTERNATIVE SELECTORS:
      📍 Navigation Bar Alternatives: (none found)
      📍 Title Alternatives: (none found)
      📍 Product Details Alternatives: (none found)
      📍 Author Information Alternatives: (none found)

   📑 MAJOR ID ELEMENTS ON PAGE: (none found)
   ```

5. **ボット検出の確認**
   ```
   🤖 CHECKING FOR BOT DETECTION:
      ⚠️ POTENTIAL BOT DETECTION FOUND:
         - CAPTCHA
   ```

## 根本原因

### Amazonのボット検出メカニズム

Amazonは以下の要因で自動化されたアクセスを検出しています：

1. **Headlessブラウザの検出**
   - Playwrightのデフォルト設定ではHeadlessモードで実行
   - `navigator.webdriver`プロパティなどで検出

2. **アクセスパターンの分析**
   - 短時間での連続アクセス
   - 人間らしくないナビゲーションパターン

3. **IPレピュテーション**
   - GitHub ActionsのIPアドレス（Wyoming, US）は多数のボットからアクセスされる
   - Amazonのブラックリストに含まれている可能性

4. **ブラウザフィンガープリント**
   - User-Agent
   - ブラウザ機能の組み合わせ
   - JavaScriptエンジンの挙動

## 解決策の検討

### オプション1: テスト対象から除外 ❌

**内容**: Amazon (Japanese)をVPNテスト対象から完全に削除

**メリット**:
- 即座にテスト失敗を解消
- メンテナンスコスト削減

**デメリット**:
- Amazon対応が継続的に検証されない
- 日本の主要ECサイトの一つをカバレッジから外すことになる

### オプション2: Amazon English版に切り替え ❌

**内容**: `.co.jp`から`.com`に変更

**メリット**:
- 地理的制限が緩い可能性

**デメリット**:
- 同様のボット検出がある
- 日本語書籍との整合性が低い
- 根本的な解決にならない

### オプション3: Playwrightのステルス設定を強化 ✅ **採用**

**内容**: ブラウザの挙動をより人間らしく偽装

**実装内容**:
1. User-Agent設定
2. ヘッドフルモード（必要に応じて）
3. 追加のブラウザコンテキスト設定
4. リクエスト遅延の追加
5. JavaScript API の偽装

**メリット**:
- Amazon対応を維持
- 他のサイトにも応用可能
- 段階的に調整可能

**デメリット**:
- 完全な成功は保証されない
- Amazonの検出強化で将来的に失敗する可能性
- 実装とメンテナンスのコスト

## 実装方針

### ステルス設定の実装

#### 1. 専用のブラウザコンテキスト設定

```typescript
// Amazon専用のコンテキスト設定
const stealthContext = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
  permissions: ['geolocation'],
  geolocation: { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
  colorScheme: 'light',
  extraHTTPHeaders: {
    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  }
};
```

#### 2. JavaScript APIの偽装

```typescript
await page.addInitScript(() => {
  // navigator.webdriver を削除
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });

  // Chrome runtime を追加
  (window as any).chrome = {
    runtime: {},
  };

  // Permissions API の偽装
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = ((parameters: PermissionDescriptor) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: 'denied', onchange: null } as PermissionStatus) :
      originalQuery.call(window.navigator.permissions, parameters)
  )) as typeof originalQuery;
});
```

#### 3. アクセスパターンの人間化

```typescript
// ページロード前のランダム待機
await page.waitForTimeout(Math.random() * 2000 + 1000);

// マウス移動のシミュレーション
await page.mouse.move(100, 100);
await page.mouse.move(200, 200);

// スクロール動作
await page.evaluate(() => {
  window.scrollBy(0, 100);
});
```

#### 4. 段階的な読み込み待機

```typescript
// domcontentloaded → load → networkidle の段階的待機
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('load');
await page.waitForTimeout(2000); // 追加の安定化待機
```

### テスト実装の調整

#### shared.ts の更新

```typescript
export async function setupStealthMode(page: Page): Promise<void> {
  // JavaScript API偽装
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as any).chrome = { runtime: {} };
  });

  // 人間らしい動作
  await page.waitForTimeout(Math.random() * 1000 + 500);
}

// Amazon専用のヘルパー
export async function navigateToAmazonWithStealth(page: Page, url: string): Promise<void> {
  await setupStealthMode(page);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
}
```

#### static-sites.test.ts の更新

```typescript
// Amazonサイトの場合のみステルス設定を適用
if (service.includes('Amazon')) {
  await setupStealthMode(page);
}
```

## 期待される効果

1. **CAPTCHA回避率の向上**
   - User-Agent偽装により通常ブラウザとして認識
   - JavaScript API偽装でHeadless検出を回避

2. **テスト安定性の向上**
   - 人間らしいアクセスパターン
   - 適切な待機時間

3. **将来の拡張性**
   - 他のサイトでも同様の問題が発生した場合に適用可能
   - ステルス設定の段階的な強化が可能

## リスクと制限事項

### リスク

1. **完全な成功は保証されない**
   - Amazonの検出システムは高度で継続的に進化
   - 新しい検出手法が導入される可能性

2. **パフォーマンスへの影響**
   - 追加の待機時間によりテスト実行時間が増加
   - 1サイトあたり+2~3秒程度

3. **規約上の懸念**
   - 自動化されたアクセスを偽装する行為
   - Amazonの利用規約に抵触する可能性（ただし監視目的は通常許容範囲）

### 制限事項

1. **VPN環境でのテストのみ**
   - `requiresJapanIP: true`のため日本IPが必要
   - VPN接続の安定性に依存

2. **メンテナンスコスト**
   - Amazonの検出システム変更に応じた調整が必要
   - 定期的な動作確認とチューニング

## 代替案への切り替え基準

以下の条件を満たす場合、オプション1（テスト除外）への切り替えを検討：

1. ステルス設定実装後も3日間連続でテスト失敗
2. CAPTCHA回避率が50%未満
3. 他の主要ECサイト（DLsite、FANZA、メロンブックス等）で十分なカバレッジが確保されている

## まとめ

- **根本原因**: AmazonのCAPTCHA/ボット検出システム
- **採用方針**: Playwrightステルス設定の強化
- **期待効果**: CAPTCHA回避、テスト安定性向上
- **リスク管理**: 効果が不十分な場合は除外に切り替え

## 参考資料

- デバッグテスト実装: `src/__tests__/large/monitoring/amazon-debug.test.ts`
- CI実行ログ: https://github.com/motoso/uni/actions/runs/21059430413
- Playwright Stealth: https://playwright.dev/docs/emulation

---

## 実装結果と最終決定

### ステルスモード実装と検証

**実装日**: 2026-01-18

#### 実装内容
1. `setupStealthMode()` - JavaScript API偽装
   - `navigator.webdriver`の削除
   - `chrome.runtime`の追加
   - Permissions APIの偽装
   - ランダム待機の追加

2. `navigateToAmazonWithStealth()` - Amazon専用ナビゲーション
   - ステルスモード適用
   - マウス移動シミュレーション
   - スクロールシミュレーション
   - 安定化待機（2秒）

3. Playwright設定強化
   - User-Agent更新（Chrome 131.0.0.0）
   - ロケール/タイムゾーン設定（ja-JP/Asia/Tokyo）
   - HTTPヘッダー追加

#### 検証結果

**通常CI環境テスト**（Run ID: 21115941960）
- 環境: GitHub Actions (Wyoming, US)
- 結果: ❌ **失敗 - CAPTCHA検出継続**
- HTML長: 5,718文字（CAPTCHAページ）
- 検出内容: `opfcaptcha.amazon.co.jp`

**VPN環境テスト**（Run ID: 21115987687）
- 環境: ProtonVPN経由（日本IP）
- 結果: ❌ **失敗 - CAPTCHA検出継続**
- 全4テストケース失敗（Chromium/Firefox × セレクタ/挿入ターゲット）
- エラー: `TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.`

### 最終決定: テスト対象から除外

#### 判断根拠

上記「代替案への切り替え基準」の条件を満たしたため、**Amazon (Japanese)をテスト対象から除外**することを決定：

1. ✅ ステルス設定実装後も即座にテスト失敗（3日間待つまでもなく）
2. ✅ CAPTCHA回避率 0%（50%未満）
3. ✅ 他の主要ECサイトで十分なカバレッジ確保
   - DLsite、FANZA（Video/Doujin/Books）、メロンブックス、とらのあな、駿河屋等

#### Amazonのボット検出が回避不可能な理由

以下の対策を組み合わせても検出されました：

1. **日本IPアドレス** - ProtonVPN経由でも検出
2. **最新User-Agent** - Chrome 131.0.0.0でも検出
3. **JavaScript API偽装** - navigator.webdriver削除でも検出
4. **人間らしい動作** - マウス移動・スクロールでも検出
5. **適切なロケール設定** - ja-JP、Asia/Tokyoでも検出

Amazonは以下のような高度な検出手法を使用していると推測されます：
- GitHub ActionsのIPレンジをブラックリスト化
- Canvas/WebGLフィンガープリント
- Headlessブラウザの細かい挙動差異の検出
- ネットワークパターン分析

### 除外の実装

**変更内容**:
```typescript
// src/__tests__/large/monitoring/shared.ts

// staticSites配列からAmazon (Japanese)を削除
// コメントで除外理由を記載

// insertionTargetsからAmazon (Japanese)を削除
// コメントで除外理由を記載
```

### ステルスモード実装の今後

**他サイトへの適用可能性**:
- ステルスモード実装は`shared.ts`に残す
- 将来的に他のサイトでボット検出が発生した場合に再利用可能
- 実装済みの機能:
  - `setupStealthMode()` - 汎用的なステルス設定
  - `navigateToAmazonWithStealth()` - サイト専用ナビゲーション（名前変更可能）
  - 定数化された待機時間設定

### 教訓

1. **大手ECサイトのボット検出は非常に高度**
   - 単純なUser-Agent偽装では不十分
   - IPレピュテーション、ブラウザフィンガープリント、行動分析など多層的な検出

2. **CI環境の制約**
   - GitHub ActionsのIPは多数のボットからアクセスされブラックリスト化されやすい
   - VPN経由でもHeadlessブラウザの検出は困難

3. **テスト対象の選定基準**
   - ボット検出が厳しいサイトは除外も選択肢
   - 他のサイトで十分なカバレッジを確保できれば問題なし
   - メンテナンスコストと効果のバランスを考慮

### 結論

Amazon (Japanese)のボット検出システムは、現在利用可能な技術では回避困難であることが実証されました。他の主要ECサイト（DLsite、FANZA系、メロンブックス等）で十分なテストカバレッジが確保されているため、Amazon (Japanese)を除外してもプロジェクトの品質保証には影響しないと判断しました。

ステルスモード実装は今回の目的では効果がありませんでしたが、将来的な他サイトへの適用可能性を考慮してコードベースに残します。

**最終ステータス**: Amazon (Japanese) - テスト対象から除外（2026-01-18）
