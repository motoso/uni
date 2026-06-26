# ADR-002: ビルド / エントリポイント基盤の方針

## Status

Accepted

## Date

2026-06-27

## Context

uni は Chrome (MV3 service worker) / Firefox (MV3 event pages) 向けのブラウザ拡張で、対応 EC / メディアサイトの商品ページに content script を注入し、Cosense に蔵書ページを作成・検出する。

リファクタリング計画 ([docs/refactoring-plan.md](../refactoring-plan.md)) の Phase 5（サイトレジストリ化）と Phase 7b（ビルド基盤の本移行）、Phase 8（バー UI ランタイム軽量化）の作り込み方は、ビルド基盤をどうするかに従属する。先に基盤の方針を決めないと、Phase 5 で自前 generator を作り込んでから framework に移行して捨てる、という二重作業になりうる。本 ADR はその方針を Phase 7a として先に確定する。

### 現状のビルド構成

- バンドラ: webpack 5 (`webpack.common.js` / `webpack.dev.js` / `webpack.prod.js`)
- TypeScript: `ts-loader`、SCSS: `sass-loader` → `css-loader` → `style-loader`（JS 内 inject）
- manifest: `src/manifest.json` を単一ソースとし、`wext-manifest-webpack-plugin` / `wext-manifest-loader` が `__chrome__*` / `__firefox__*` プレフィックスキーを解決してブラウザ別 manifest を生成
- 出力: `dist/chrome/` / `dist/firefox/`、`TARGET_BROWSER` env で切替
- popup: `html-webpack-plugin`
- React 19 / react-dom 19

### 散らばり（ドリフト）の実測

新サイト 1 つの追加・変更が、以下に分散している。

1. `src/constant.ts` — `AcceptedService`
2. `src/manifest.json` — `content_scripts[].matches` / `js`
3. `src/manifest.json` + `src/eventPage.ts` — `declarativeContent` の `PageStateMatcher`（Chrome の popup action 表示条件）
4. `webpack.common.js` — `entry`
5. `src/contentScript/*.tsx` — エントリ本体
6. `src/scraping/*.ts` — scraper
7. tests

これは手書き同期であり、すでにドリフトしている。`webpack.common.js` の content script entry は 14 件あるのに対し、`eventPage.ts` の `declarativeContent` ルールは 7 ホストしか登録していない。結果として **FANZA 同人 / 動画 / アニメ (`www.dmm.co.jp` / `video.dmm.co.jp`)、FC2、DMM / DLsite のカートページでは popup action の表示ルールが欠落**している。content_scripts の `matches`、webpack の `entry`、declarativeContent の `PageStateMatcher` が三重に手書きで、整合チェックがないことの典型的な帰結である。

さらに content script ごとに `react-dom` を個別バンドルしており（14 エントリ、9 ファイルが `createRoot` を直接利用）、一行のバー UI に対してランタイムが重い（Phase 8 の対象）。

## 検証（Phase 7a PoC・実測）

机上比較で終えず、ベースライン実測と WXT の PoC を行った（PoC は scratchpad に `wxt@0.20.27` で構築し、uni の manifest の難所だけを再現してビルド・生成結果を確認）。

### ベースライン: 現状 webpack の実測

- Chrome 本番ビルド (`npm run build:chrome`): **約 10 秒**（real 9.96s / user 42.24s）
- content script バンドル: **14 本が各 ~210–227 KB**（`react-dom` が各エントリに重複バンドル）
- `dist/chrome` 合計: **3.3 MB**、うち content script で約 3.1 MB

→ Phase 8（バー UI ランタイム軽量化）の必要性が数値で裏付けられた。react-dom 重複が bundle の支配項。

### WXT PoC: 危険な主張の検証結果

uni の manifest で難所になりうる点（declarativeContent permission、Firefox gecko キー、ブラウザ別 background、content_scripts 生成、permission 分岐）を最小エントリで再現し、Chrome / Firefox 両方をビルドして生成 manifest を確認した。

| 検証項目 | 結果 |
|---|---|
| Chrome MV3 `background.service_worker` + `permissions:["declarativeContent","storage"]` | ✓ 期待どおり生成 |
| Firefox MV3（event pages = `background.scripts`） | ✓ ただし **WXT 既定の Firefox は MV2**。`manifestVersion: 3` を明示して MV3 を再現（uni 現状と一致） |
| `browser_specific_settings.gecko` / `data_collection_permissions` / `gecko_android` | ✓ `manifest` 関数で注入でき、現状の `__firefox__` キーと等価 |
| ブラウザ別 permission（declarativeContent は Chrome のみ） | ✓ `browser === "chrome"` 分岐で表現可 |
| `content_scripts[].matches` をエントリ宣言 (`defineContentScript({ matches })`) から自動生成 | ✓ manifest の content_scripts は生成物になり、**entry / matches の二重手書きが消える** |

確認できた事実:

- `declarativeContent` は **permission 文字列** であり WXT で問題なく付与できる。`PageStateMatcher` による**ルール登録は background のコード**側（現状の `eventPage.ts` と同じ）に残るため、manifest 生成とは独立。WXT 移行後も declarativeContent ルールは手書きコードのままで、ここは framework に吸収されない（ただしルールの導出元を後述の registry に一元化すれば、欠落ドリフトは防げる）。
- WXT の Firefox 既定が MV2 である点は、`manifestVersion: 3`（または per-browser 指定）で解消できる一行の差。ブロッカーではないが移行 PR の必須チェック項目。

### 未検証 / PoC の限界

- WXT content script の **react-dom 実バンドルサイズ比較は未実施**（PoC のエントリは空のため）。これは Phase 8 で 1 サイト PoC として React → Preact compat を含めて測るのが妥当で、Phase 7a の決定には影響しない。
- HMR / dev 体験、`wxt zip` の配布物互換は PoC のビルド成功までを確認。実運用差は Phase 7b の 1 サイト移行 PoC で確認する。
- crxjs (案 B) の Firefox manifest 自前分岐の重さは PoC せず、ドキュメントベースの判断に留めた（推奨でないため）。

## Decision Drivers

- **ドリフト削減**: エントリ / manifest / 表示条件の手書き三重管理をなくす（Phase 5 / P5・P7 の本丸）
- **Chrome / Firefox 両対応**: MV3 の background 差異（service_worker vs scripts）と Firefox 固有キー（`browser_specific_settings.gecko`、`data_collection_permissions`）を生成できること
- **保守コスト**: メンテナは実質単独・コミット頻度が低い。自前ツールを継続保守する余力は小さい
- **後戻り可能性**: 採用後に合わなかった場合の離脱コスト
- **既存資産の再利用**: `BaseContentScript` / scraper / Small テスト / `wext-manifest` の `__chrome__` 規約を壊さないこと
- **Phase 8 との相性**: react-dom 重複削減（Preact compat 等）を後で入れやすいこと

## Considered Options

### 案 A: webpack 維持 + registry-driven generation

`src/sites/registry.ts` のような単一ソースから、webpack の `entry`、manifest の `content_scripts`、declarativeContent ルールを生成する自前スクリプトを書く。

- **+** 既存ビルドを壊さない。移行リスク最小。`wext-manifest` 規約をそのまま使える。後戻りコストほぼゼロ
- **+** registry という概念は framework 非依存で、将来どの案に移っても残せる
- **−** generator と manifest 生成ロジックを **自前で永続保守** する。webpack の冗長な loader 設定・HMR の弱さ・react-dom 重複はそのまま
- **−** dev サーバ / HMR の改善が得られず、content script の反復開発体験は据え置き
- **−** Phase 8 の Preact 化は別途手作業

### 案 B: Vite + `@crxjs/vite-plugin`

Vite に移行し、crxjs プラグインが `manifest.ts` から content_scripts / entry を解決、HMR を提供。

- **+** webpack より高速なビルド・dev HMR。manifest を単一ソース化でき、content script entry の手書きが減る
- **+** Vite エコシステム（esbuild / rollup）に乗れる。Preact alias も容易（Phase 8）
- **−** Chrome / Firefox の manifest 差異（背景の service_worker vs scripts、gecko キー、`data_collection_permissions`）は crxjs だけでは吸収しきれず、ブラウザ別 manifest 分岐を自前で持つ必要が残る。`wext-manifest` の `__chrome__/__firefox__` 規約は捨てることになる
- **−** crxjs は MV3 / Firefox 対応の成熟度がプラグイン依存で、quirk に当たると自前回避が要る
- **−** declarativeContent ルールの生成は引き続き自前

### 案 C: WXT

拡張専用 framework。`entrypoints/` のファイルベース規約で content script / background / popup を定義し、`wxt.config.ts` の `manifest` から **Chrome / Firefox 別の manifest を自動生成**。`-b firefox` でターゲット切替、HMR / dev 実行内蔵。

- **+** エントリと manifest の手書き三重管理を framework が吸収する。**P5 / P7 のドリフトを構造的に解消**（content script の `matches` をエントリ自身に宣言し、manifest が生成される）
- **+** Chrome MV3 / Firefox MV3 の background 差異・gecko キーを公式に扱える。`manifest` フックで `data_collection_permissions` や declarativeContent permission も注入できる（**PoC で生成 manifest を確認済み**）。ただし WXT の Firefox 既定は MV2 のため、現状の Firefox MV3 を保つには `manifestVersion: 3` の明示が要る
- **+** dev HMR / `wxt build` / `wxt zip`（配布 zip 生成）が内蔵で、`package:chrome/firefox` 相当を置換できる
- **+** Preact mode を含む UI ランタイム差し替えに公式対応（Phase 8 の選択肢が広がる）
- **−** 移行範囲が最大。`entrypoints/` への配置換え、`wxt.config.ts`、`wext-manifest` からの離脱が必要。Phase 6 fixture テストが揃う前にやるとリグレッションの切り分けが困難
- **−** framework の規約・抽象に乗るため、想定外の quirk（declarativeContent、特殊 host match）で逃げ道が framework のフック次第になる（ロックイン）

## Decision

**案 C (WXT) を採用する**（2026-06-27、オーナー判断で確定）。

> 補足: 速度（実行時）が目的なら React→Preact が唯一のレバーであり、ビルド基盤 (webpack/WXT) とは直交する（uni の UI は `createRoot` + `useState`/`useEffect`/`useCallback` のみで React 19 専用 API 不使用 → `preact/compat` で webpack のまま alias 一発で置換可能、移行不要）。本 ADR で WXT を採る目的は **速度ではなく、entry / manifest / 表示条件の手書き三重管理とそのドリフト解消（保守性）** である。実行時高速化は Phase 8 として独立に扱う。

採用は二段構えとする。

1. **いま（Phase 7a の成果物）**: WXT を「移行先候補」として確定し、Phase 5 では **自前 generator を作り込まない**。Phase 5 で必要なサイト情報（service / host / match pattern / product type / scraper / product factory / content script entry）は、framework 非依存な **plain registry / 宣言オブジェクト** として `src/sites` に集約するに留める。これは案 A・B・C のどれに転んでも捨てない資産になる。
2. **後（Phase 7b）**: Phase 6 の fixture テストが主要サイトに入り、Phase 1.5 の message boundary 一本化が済んでいる前提で、挙動凍結のまま WXT へ移行する。移行 PR にロジック変更を混ぜない。

WXT を推す理由は、本リポジトリの最大負債が「エントリ / manifest / 表示条件の手書き三重管理とそのドリフト（declarativeContent の欠落が実証済み）」であり、これを **構造的に消せるのは framework のファイルベース規約だけ** だからである。単独メンテで自前 generator（案 A）を永続保守するより、拡張専用 framework に寄せる方が長期保守コストが低い。Chrome / Firefox 両対応の manifest 生成も WXT が公式に扱う領域で、`wext-manifest` 自前運用より堅い。

案 A は「移行リスクゼロだが負債が残り、自前ツールの保守が増える」、案 B は「ビルドは速くなるが Firefox manifest 差異を自前で持ち続け、ドリフトの本丸は解けない」。両者とも P5 / P7 を半分しか解かない。

## Consequences

### Positive

1. Phase 5 を framework に依存しない registry 集約に限定でき、Phase 7a/7b のどちらに転んでも捨て作業が出ない
2. WXT 移行後はエントリ追加が 1 ファイル（`entrypoints/<site>.content.ts` 等）に収束し、manifest / declarativeContent / entry の三重ドリフトが構造的に消える
3. Chrome / Firefox manifest 生成・配布 zip 生成を framework に委譲でき、`webpack.common.js` / `wext-manifest` / `package:*` の手書きが減る
4. Phase 8（Preact compat）の選択肢が framework 公式機能として開ける

### Trade-offs / Risks

1. WXT 移行は範囲が大きく、**Phase 6 の fixture テストが主要サイトに入るまで着手しない**（リグレッション切り分けのため）。これは計画の着手順 (7a → 6 → … → 7b) と整合する
2. framework ロックイン: declarativeContent permission・gecko キー・content_scripts 生成は PoC で表現可能と確認済み。残るのは declarativeContent の **ルール登録コード**（`PageStateMatcher`）が引き続き手書きである点。これ自体は現状と同じだが、ルールの導出元を Phase 5 の registry に一元化して欠落ドリフトを防ぐ
3. `wext-manifest` の `__chrome__/__firefox__` 規約は WXT 移行で廃止される。`browser_specific_settings.gecko` / `data_collection_permissions` の移植は PoC で再現済みだが、移行 PR のチェック項目として残す
4. **WXT の Firefox 既定は MV2**。uni は Firefox MV3 を維持するため `manifestVersion: 3`（または per-browser 指定）を必須設定とする（PoC で MV3 生成を確認済み）
5. 推奨が覆り案 A を採る場合でも、Phase 5 の plain registry はそのまま generator の入力として使えるため、本 ADR の「Phase 5 は registry 集約に留める」方針は案に依らず有効

## Phase 5 / 7b への影響（明示）

- **Phase 5**: 自前 generator を作らない。`src/sites` に plain な site registry（service / host / match / product type / scraper / factory / entry）を置くだけにする。dependency-cruiser で registry の依存方向（registry は scraper / factory を参照してよいが UI / extension runtime に依存しない）を将来 error 化する余地を残す。
- **Phase 7b**: WXT 採用が確定した場合のみ実行。前提条件は (a) Phase 6 fixture テストが主要サイトに存在、(b) Phase 1.5 の message boundary 一本化済み（達成済み）、(c) 移行 PR はロジック変更を含めない。PoC は 1 サイト（例: BookWalker）で行い、declarativeContent・Firefox gecko キー・配布 zip の 3 点を検証してから全面移行する。
- **Phase 8**: WXT の Preact mode を第一候補にできる。PoC は引き続き 1 サイトで bundle size を比較する。

## References

1. [docs/refactoring-plan.md](../refactoring-plan.md) — Phase 7a / 5 / 7b / 8
2. [ADR-001: テスト戦略と TDD 実践方針](001-test-strategy-and-tdd.md)
3. WXT (Next-gen Web Extension Framework) — ファイルベース entrypoints / 自動 manifest 生成 / Chrome・Firefox ターゲット
4. `@crxjs/vite-plugin` — Vite ベースの拡張ビルド
