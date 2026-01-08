# テストサイズ戦略

このプロジェクトでは、t-wadaさんのテストサイズ戦略を採用しています。

## テストサイズ定義

### Small テスト
- **実行環境**: 単一プロセス
- **制約**: ネットワーク/DB/FS アクセス不可
- **特徴**: 高速、安定、決定的
- **対象**: 純粋な関数、ロジック、単体テスト

### Medium テスト
- **実行環境**: 単一マシン
- **制約**: localhost ネットワーク/DB/FS 利用可
- **特徴**: 統合的、実環境に近い
- **対象**: DOM操作、実サイトアクセス、統合テスト

### Large テスト
- **実行環境**: 複数マシン
- **制約**: 真の外部システム利用
- **特徴**: エンドツーエンド、高コスト
- **対象**: クリティカルユーザージャーニー

## 基本原則

**常に可能な限り左側（Small）のテストを書く**

- 統合テストでも Small で書けるなら Small にする
- E2E テストでも Medium で十分なら Medium にする
- Large は真に必要な場合のみ

## ディレクトリ構造

```
src/__tests__/
├── small/                           # Small: 高速・安定なユニットテスト
│   ├── product/
│   │   ├── title-normalization.test.ts    # Doujinshi タイトル正規化
│   │   ├── placeholder-film.test.ts       # Film プレースホルダー置換
│   │   ├── placeholder-doujinshi.test.ts  # Doujinshi プレースホルダー置換
│   │   ├── placeholder-book.test.ts       # Book プレースホルダー置換
│   │   └── placeholder-asmr.test.ts       # ASMR プレースホルダー置換
│   └── scraping/                          # スクレイピング関数単体テスト
│       └── [サイト名]-scraper.test.ts
├── medium/                          # Medium: 実環境アクセスあり統合テスト
│   └── monitoring/
│       ├── shared.ts                      # 共通ヘルパー関数・型定義
│       ├── static-sites.test.ts           # 静的サイト監視テスト
│       ├── spa-sites.test.ts              # SPA サイト監視テスト
│       └── scraping-logic.test.ts         # スクレイピング統合テスト
└── large/                           # Large: 必要に応じて追加
    └── critical-user-journeys.test.ts    # クリティカルユーザージャーニー
```

## テスト実行コマンド

### 開発時の推奨順序

1. **Small テスト** (高速フィードバック)
   ```bash
   npm run test:small
   ```

2. **Medium テスト** (統合確認)
   ```bash
   npm run test:medium
   ```

3. **All テスト** (Small → Medium の順)
   ```bash
   npm test
   ```

### CI での実行順序

1. **小さいテストファースト**: Small テスト → Medium テストの順で実行
2. **高速フィードバック**: Small で失敗したら Medium をスキップ
3. **並列実行なし**: Medium は外部システムアクセスのため、Small成功後に実行

## テスト技術選択

- **Small**: Jest (単体テスト、モック)
- **Medium**: Playwright (ブラウザ統合、実サイトアクセス)
- **Large**: E2E テストフレームワーク (必要に応じて)

## 期待効果

- **開発速度向上**: 高速な Small テストで即座にフィードバック
- **安定性向上**: Small テストは外部依存なしで決定的
- **コスト効率**: 右側（Large）テストの削減でCI時間短縮
- **保守性向上**: テスト責務が明確に分離

## ガイドライン

### Small テストを書くべき場合
- 純粋な関数のテスト
- ビジネスロジックのテスト
- プレースホルダー置換等の文字列処理
- 設定値の検証

### Medium テストを書くべき場合
- DOM 操作の検証
- 実際のサイトからのスクレイピング
- ブラウザ環境での動作確認
- ContentScript の統合テスト

### Large テストを書くべき場合
- 複数システムを跨ぐワークフロー
- 本番環境でのみ発生する問題の検証
- クリティカルパスの保証

## 移行経緯

- **前**: `Product.test.ts` (843行) + `monitoring.test.ts` (1,166行)
- **後**: サイズ別に分割、責務明確化、完全置き換え
- **利点**:
  - 実行時間短縮 (Small: 2秒)
  - CI フィードバック高速化 (Small → Medium)
  - メンテナンス性向上 (機能別分割)
  - t-wada の左寄せ原則に準拠

## コマンド対応表

| 旧コマンド | 新コマンド | 説明 |
|-----------|-----------|------|
| `npm test` | `npm test` | **Small → Medium の順実行** |
| `npm run test:spa` | `npm run test:medium` | Medium テスト実行 |
| - | `npm run test:small` | Small テスト実行 |