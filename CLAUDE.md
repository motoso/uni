# リリース
リリースはfirefoxとChrome両方を行います
manifest.jsonとpackage.jsonを更新した上でリリースのPRを作り、masterブランチにマージします
ストアへのリリース手順は https://scrapbox.io/motoso-uni/%E9%96%8B%E7%99%BA%E8%80%85%E5%90%91%E3%81%91%E3%81%AE%E6%83%85%E5%A0%B1 を参照してください

# 開発の作法
- masterにpushしてはいけません。masterへの変更は必ずPRを作成してください
- commitの前には必ずfmtすること
- 外部サーバーとのテストを確認する際には、時間節約のため失敗したものに限って実行すること
- PRを作成すると、Claude Codeによるレビューが行われます。一定時間待った後にコメントを確認し、criticalなコメントがあれば修正してpushすること。
# HTML要素が変わってスクレイピングに失敗する場合
対象サイトのHTMLをplaywright等で確認し、適切な情報が取れるようにscrapingロジックを書き直してください
セレクターは想像で書かずに、実際のHTMLを見て確認すること。またfallbackは設定しないこと（なくなったら実際のサイトに接続するテストが落ちるのが理想）
HTML要素が取得できなかったときのfallbackはデバッグを困難にするので必須の場合以外追加しないこと。常にDOMを確認して存在するパターンを書のが正解です

# CI環境と手元環境の違い

## 地理的IP制限による内容の違い
- **CI環境**: GitHub Actions (Wyoming, US) では海外IPとして扱われる
- **手元環境**: 日本のIPアドレスから接続

### FANZAサイトでの具体的な違い
- **CI環境**: 英語の年齢認証ページ (`/en/age_check/`) が表示される
  - ボタンテキスト: "I Agree", "Agree", "Yes" など
- **手元環境**: 日本語の年齢認証ページが表示される
  - ボタンテキスト: "はい" など

### 対応方法
年齢認証処理では両方の言語パターンを考慮する必要がある：
```typescript
const ageCheckSelectors = [
  // English patterns (for CI environment)
  'text=Agree', 'text=I Agree', 'text=Yes',
  // Japanese patterns (for local environment)
  'text=はい', 'button:has-text("はい")'
];
```

## CI環境でのDOM構造デバッグ

### 失敗時の調査手順
1. **専用デバッグテストの作成**:
   - `fanza-debug.test.ts` のような詳細DOM分析テストを作成
   - CI環境でのみ実行するように `playwright.config.ts` を設定

2. **GitHub Actionsログの確認**:
   ```bash
   gh run list --limit 5
   gh run view [RUN_ID] --log | grep -A 50 "🔍 Debugging"
   ```

3. **DOM構造の分析**:
   - ボタン要素の存在確認
   - テキストマッチング要素の検索
   - フォーム要素の分析
   - HTML構造の詳細出力

### デバッグテストのベストプラクティス
- 実際のHTMLスニペットを出力
- ボタン要素の詳細情報（tagName, textContent, className）を記録
- セレクター試行の成功/失敗を明確にログ出力
- genericなfallbackパターンは避ける（デバッグが困難になるため）

### 専用デバッグワークフローの活用

#### デバッグ専用CIワークフロー
`.github/workflows/debug-ci-environment.yml` で手動実行可能なデバッグ専用ワークフローを提供しています。

##### 実行方法
1. GitHubリポジトリの「Actions」タブに移動
2. 「Debug CI Environment」ワークフローを選択
3. 「Run workflow」をクリック
4. デバッグターゲットを選択して実行

##### デバッグターゲット
- **fanza**: FANZAサイトのみ
- **amazon**: Amazonサイトのみ
- **dlsite / bookwalker / melonbooks / toranoana / surugaya / fc2**: 各サービス個別
- **all-spa**: 全SPAサイト
- **all-static**: 全静的サイト

##### 柔軟なテスト実行
- **Custom test pattern**: 独自のgrep形式パターンでテスト選択可能
- **Test type**: debug, access-check, spa-sites, static-sites, scraping-logic から選択

##### 使用例
```bash
# FANZAサイトの詳細デバッグテストを実行
Debug target: fanza, Test type: debug

# 特定パターンのテストを実行
Custom test pattern: "FANZA Video|Amazon.*English"
```

#### デバッグテストの詳細機能
`src/__tests__/medium/monitoring/fanza-debug.test.ts` の機能：
- HTML構造の詳細分析（文字数、プレビュー）
- ボタン要素の全探索と詳細情報出力
- テキストベースマッチング要素の検索
- フォーム要素の分析
- 年齢認証セレクターの体系的試行
- 成功したセレクターの詳細情報出力

このテストは通常は無効化されているが、デバッグワークフローでは自動的に有効化される。

## CI環境での海外版FANZAサイト挙動

### CI環境（Wyoming, US IP）でのアクセスパターン

#### 1. 年齢認証段階
- **英語版年齢認証ページ**: `/en/age_check/` が表示される
- **ボタンテキスト**: "I Agree", "Agree", "Yes" など（日本語の「はい」ではない）
- **現在の対応状況**: ✅ 修正済み（`text=Agree`セレクターで対応完了）

#### 2. 年齢認証成功後の挙動
CI環境では年齢認証突破後に以下の2つのパターンに分岐：

##### パターンA: ログインページリダイレクト（大部分のケース）
```
年齢認証成功 → https://accounts.dmm.co.jp/service/login/password/=
```
- **頻度**: 約80-90%のケース
- **原因**: 海外IPに対するログイン認証要求
- **制限事項**: ログインページでは商品情報のスクレイピング不可
- **現在の判定**: ❌ 「年齢認証失敗」として誤判定される

##### パターンB: 直接商品ページアクセス（稀なケース）
```
年齢認証成功 → https://video.dmm.co.jp/av/content/?id=xxxxx
```
- **頻度**: 約10-20%のケース
- **結果**: ✅ 正常にスクレイピング可能
- **判定**: 現在でも正常に成功判定される

#### 3. 地理的制限による影響
- **日本IP（手元環境）**: 年齢認証のみでアクセス可能
- **海外IP（CI環境）**: 年齢認証 + ログイン認証が基本的に必要
- **商用利用制限**: 海外IPからの自動アクセスに対する追加制限

### テスト成功/失敗の判定基準

#### 現在の問題
`handleAgeVerification`関数の107行目：
```typescript
if (finalUrl.includes('age_check') || finalUrl.includes('login')) {
  throw new Error(`Age verification failed - still on auth page: ${finalUrl}`);
}
```
この条件により、年齢認証成功後のログインページも「失敗」として扱われる。

#### 推奨される対応方針

##### オプション1: ログインページを部分成功として扱う
- 年齢認証突破は成功として認識
- ログインページでの基本DOM要素（タイトル、フォーム）を検出
- 商品情報は取得できないが「アクセス可能」として判定

##### オプション2: CI環境での制限を明示
- 海外IP制限によるログイン要求を正常動作として文書化
- CI環境では「年齢認証突破まで」を成功とする基準に変更
- 商品情報スクレイピングは地理的制限により期待しない

### CI環境でのテスト成功/失敗基準

#### 現在の基準（問題あり）
```typescript
// 年齢認証成功後のログインページも「失敗」として扱ってしまう
if (finalUrl.includes('age_check') || finalUrl.includes('login')) {
  throw new Error(`Age verification failed - still on auth page: ${finalUrl}`);
}
```

#### 提案する新基準

##### レベル1: 完全成功（理想的）
- 年齢認証突破 ✅
- 商品ページアクセス ✅
- 商品情報スクレイピング可能 ✅
- **判定**: テスト成功

##### レベル2: 部分成功（CI環境での標準）
- 年齢認証突破 ✅
- ログインページ到達 ⚠️
- 商品情報スクレイピング不可 ❌
- **判定**: 地理的制限により部分成功（テスト成功とみなす）

##### レベル3: 失敗
- 年齢認証突破できない ❌
- 年齢認証ページから進めない ❌
- **判定**: テスト失敗

#### 実装時の判定ロジック
```typescript
// 推奨される判定ロジック
if (finalUrl.includes('age_check')) {
  // 年齢認証ページから進めない = 真の失敗
  throw new Error(`Age verification failed - still on age check page: ${finalUrl}`);
} else if (finalUrl.includes('login')) {
  // ログインページ = 年齢認証成功、地理的制限による部分成功
  console.log('✅ Age verification succeeded, but login required due to geographic restrictions');
  // 基本的なログインページ要素の確認
  await page.waitForSelector('input[type="password"], form', { timeout: 5000 });
} else {
  // 商品ページ = 完全成功
  console.log('✅ Full access succeeded');
}
```

### 将来のメンテナンス指針
1. **年齢認証修正時**: 英語と日本語両方のパターンを考慮
2. **新サイト対応時**: 地理的IP制限の有無を事前確認
3. **CI失敗調査時**: ログインページ到達は「部分成功」として評価
4. **デバッグ時**: 専用デバッグワークフローでDOM構造を詳細分析
5. **テスト基準更新時**: 3段階の成功レベルを適用
