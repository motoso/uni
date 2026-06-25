# テスト戦略

このプロジェクトでは、`basho` と同じく t-wada 流のテストサイズ戦略と Kent Beck の TDD (Red-Green-Refactor) を採用します。

詳細な意思決定は [docs/adr/001-test-strategy-and-tdd.md](docs/adr/001-test-strategy-and-tdd.md) を参照してください。

## 基本方針

- 常に可能な限り左側 (Small) のテストを書く
- 新しいロジックは、先に仕様を表すテストを書いてから実装する
- DOM や外部サイトに触る前に、可能な限り純粋な parsing / normalization / mapping に切り出す
- 実外部サイトを叩くテストは Large として扱い、PR の高速フィードバックとは分離する
- Large の失敗は「プロダクトの regression」と「サイト変更・地域差・ネットワーク制限」を切り分けて扱う

## テストサイズ定義

| サイズ | ディレクトリ | 実行コマンド | 制約 | 適用対象 |
|---|---|---|---|---|
| Small | `src/__tests__/small/` | `npm run test:small` | 単一プロセス。network / FS / 実ブラウザ / 外部 API なし | Product の placeholder 展開、タイトル正規化、popup の正規化、scraper の純粋ロジック |
| Medium | `src/__tests__/medium/` | 未採用 | 単一マシン。localhost / fixture / 実ブラウザ可。実外部サイトなし | 将来の拡張機能 UI 統合、ローカル fixture HTML に対する ContentScript 検証 |
| Large | `src/__tests__/large/` | `npm run test:large*` | 実外部サイト / VPN / 地理差あり | サイト監視、実 DOM セレクター検証、年齢認証・地域差の監視 |

## 実行コマンド

```bash
npm test                    # PR-safe: Small のみ
npm run test:pr             # npm test と同じ。PR 前の高速確認
npm run test:small          # Jest unit tests
npm run test:all            # Small -> Large。外部サイトまで明示的に確認する
npm run test:large          # Playwright monitoring tests
npm run test:large:global   # VPN 不要の外部サイト監視
npm run test:large:japan    # 日本 IP 前提の外部サイト監視
npm run test:failed-only    # 抽出済みの失敗 Large テストだけ再実行
```

## TDD の適用範囲

| 領域 | 方針 |
|---|---|
| Product / placeholder / title normalization | Small でテストファースト |
| Popup や設定値の変換ロジック | Small でテストファースト |
| Scraper の parsing ロジック | 実 DOM 調査後、可能なら Document / Element fixture で Small 化してから実装 |
| ContentScript の DOM 挿入位置 | Medium 化できるなら fixture HTML で検証。実サイト差分は Large で監視 |
| 年齢認証、地域差、サイト構造監視 | Large。修正前に実 HTML を確認し、想像で selector を書かない |

## CI ポリシー

- PR / push の高速 CI は Small を最速で実行する
- Large は日次 CI と手動 workflow で実行する
- Japan-restricted な Large は VPN 経由で実行する
- Large の 403 / ログイン要求 / 地域差は、失敗として扱う前に環境要因かを切り分ける
- Large で検出したサイト構造変更は、可能な限り Small の parser テストにも還元する

## テストで避けること

- 実装をコピーしただけの self-fulfilling test
- 外部サイトの一時的な失敗をプロダクト regression と混同すること
- selector の想像実装
- 必要以上の fallback。サイト構造が変わったら Large が落ちる方が調査しやすい
- Large を PR の標準確認として常用すること
