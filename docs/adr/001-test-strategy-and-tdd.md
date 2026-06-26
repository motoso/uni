# ADR-001: テスト戦略と TDD 実践方針

## Status

Accepted

## Date

2026-06-26

## Context

uni は Chrome / Firefox 向けのブラウザ拡張で、Cosense に作品情報ページを作るために複数の実 EC / 配信サイトから情報を取得する。Product の placeholder 展開、タイトル正規化、scraper の parsing などは純粋ロジックとして高速・決定的にテストできる。一方、実サイト監視は DOM 変更、年齢認証、地域差、Cloudflare / bot detection、VPN の状態に左右される。

t-wada 流のテストサイズ戦略と Kent Beck の TDD (Red-Green-Refactor) を採用する。ただし uni では実外部サイトの構造変化を検知する価値があるため、Large を完全には捨てず、PR ブロッキングではなく監視用途に限定して運用する。

## Decision

### 1. テストサイズ戦略

| サイズ | ディレクトリ | 制約 | 適用対象 |
|---|---|---|---|
| Small | `src/__tests__/small/` | 単一プロセス。network / FS / 実ブラウザ / 外部 API なし | Product、placeholder、title normalization、popup normalization、scraper の純粋ロジック |
| Medium | `src/__tests__/medium/` | 単一マシン。localhost / fixture / 実ブラウザ可。実外部サイトなし | fixture HTML に対する ContentScript 統合、将来の拡張機能 UI 統合 |
| Large | `src/__tests__/large/` | 実外部サイト / VPN / 地域差あり | 実 DOM セレクター監視、年齢認証、サイト構造変更検知 |

#### Shift-left 原則

- 常に可能な限り左 (Small) で書く
- DOM / network に依存する前に、parsing / normalization / mapping を pure function に切り出す
- 実サイトで再現した bug は、可能なら fixture 化して Small か Medium に還元する
- Large は「実サイトが今も期待通りか」を監視するために使い、通常の回帰検知の主戦場にしない

### 2. TDD の適用

```text
Red      仕様としてのテストを先に書く
Green    最小実装で通す
Refactor インターフェースを保ったまま内部を整える
```

| 領域 | TDD 適用 |
|---|---|
| Product / placeholder / title normalization | Yes。Small でテストファースト |
| Popup / project name normalization | Yes。Small でテストファースト |
| Scraper の pure parsing | Yes。実 HTML を確認した上で、Document / Element fixture に落として Small 化する |
| ContentScript の DOM 挿入 | 部分的。fixture HTML で Medium 化できる範囲に適用 |
| 実外部サイト監視、VPN、年齢認証 | No。Large として監視・調査用途に限定 |

### 3. 設計への制約

Small に寄せ続けるため、以下を守る。

- Site-specific な DOM 読み取りと Product 生成ロジックを混ぜすぎない
- `Document` / `Element` を受け取る scraper 関数は、実ブラウザなしでも検証できる形を優先する
- ContentScript は「どこに挿入するか」と「何を表示するか」を分離する
- 実サイト selector は想像で追加しない。Playwright や保存 HTML で実 DOM を確認してから変更する
- fallback は調査不能な false positive を増やすため、必須でない限り追加しない

### 4. ツールチェーン

| 項目 | 採用ツール |
|---|---|
| Small | Jest + ts-jest |
| Medium | Playwright または Jest + jsdom。未採用 |
| Large | Playwright |
| Format | Prettier |
| Build | webpack |

### 5. CI 構成

| Workflow | 内容 | 位置づけ |
|---|---|---|
| `.github/workflows/test.yml` | `npm run test:small` + Prettier check | PR / push の高速フィードバック |
| `.github/workflows/daily-tests.yml` | `npm run test:large:global` と VPN 経由の `npm run test:large:japan` | 実外部サイト監視 |
| `.github/workflows/debug-ci-environment.yml` | 特定サイト・特定 grep の手動実行 | CI / 地域差調査 |

`npm test` は PR-safe な Small のみを実行する。外部サイトまで確認する場合は `npm run test:all` または `npm run test:large*` を明示的に使う。

### 6. テストで避けるべき嘘

- 実装と同じ処理をテストにコピーする self-fulfilling test
- Large の環境要因を product regression として扱うこと
- skip / fallback による false negative
- 年齢認証や地域差を無視した selector 変更
- DOM を確認せずに雰囲気で selector を書くこと

## Consequences

### Positive

1. PR では Small による高速で安定した feedback が得られる
2. 実サイト監視の価値は残しつつ、flaky な外部依存を通常開発の障害にしにくい
3. Scraper の pure logic が増え、サイト構造変更時の修正範囲が見えやすくなる
4. Large で見つけた問題を Small / Medium に還元する導線が明確になる

### Trade-offs

1. `npm test` が外部サイト監視を含まなくなるため、全確認には `npm run test:all` を明示する必要がある
2. Medium はまだ未整備なので、ContentScript 統合は当面 Large と手動確認に残る
3. 実サイト監視は外部要因で失敗し得るため、失敗時の一次切り分けが必要になる

## References

1. [t-wada テストサイズの考え方](https://levtech.jp/media/article/column/detail_496/)
2. Kent Beck, Test-Driven Development: By Example
