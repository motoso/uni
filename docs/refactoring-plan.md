# uni リファクタリング計画（設計レベル）

> 作成: 2026-06-26 / Claude Code による設計レビュー + Codex(gpt-5.5) セカンドオピニオンを反映した確定版。
> 各フェーズは独立してマージ可能。master 直 push 禁止のため必ずフェーズ単位の PR とする。

## 確定した設計判断（オーナー決定済み）

1. **トランスポート: sendMessage 一本化**。port を全廃し、詳細ページ・一覧ページとも `browser.runtime.sendMessage` に統一する。uni には port（永続接続）が必須なケース（ストリーミング・長寿命双方向・onDisconnect 検知・連続イベント）が現在も近い将来も無く、現状は両経路とも実質リクエスト/レスポンスのため。push 系の将来要件は `storage.onChanged` 購読 / `tabs.sendMessage` で対応する。
2. **「もう買ってるかも」の false positive 厳密化は別 Issue**。今回のリファクタは挙動を変えず現状の `count >= 1` を維持。`existsExactTitleMatch` の実装・4語丸めの見直しは仕様検討を要するため切り出す。
3. **Amazon は「確認済み DOM バリアントごとに1セレクタ」**。投機的な7連鎖は全廃。原則1セレクタとし、実在が確認できる複数レイアウト（箇条書き `#detailBullets_feature_div` / テーブル `#productDetails...`）のみそれぞれ1セレクタを許容（CLAUDE.md の "必須の場合" に該当）。Phase6 のフィクスチャ後に実施。
4. **Phase0 のデバッグ資産は monitoring 配下に集約**。`*-specific-debug.test.ts` は残すが debug 用ディレクトリへ整理。PNG/curl/失敗 txt は除去・gitignore。
5. **エントリポイント／ビルド基盤は「判断（Phase 7a）」と「本移行（Phase 7b）」を分離**。判断（1サイト PoC＋ADR で webpack 維持＋レジストリ生成 / Vite+crxjs / WXT を比較）は **Phase 1 直後の早期**に置き、Phase 5 のスコープを左右させる。本移行は **Phase 6 のテスト網の後**に挙動凍結で実施（webpack 以外を選んだ場合のみ）。WXT が本命候補だが採否は計測後。
6. **バー UI のランタイム軽量化も評価フェーズとして計画化（Phase 8）**。react-dom×15 重複を Preact 代替 or vanilla 化で削減。Phase 7 とは独立に進められる。content script 側のみ対象（popup は React 維持）。

## 0. 背景とアーキテクチャ概観

`uni` は MV3 拡張（Chrome / Firefox）。対応 EC サイトの商品ページから書誌情報をスクレイピングし、Cosense(Scrapbox) に蔵書ページを作成・既存ページを検出する。

| 層 | ファイル | 役割 |
|---|---|---|
| Content Script | `src/contentScript/*.tsx`（15本） | サイトごとの注入エントリ。`BaseContentScript` を継承し `scrape()`/`createElementForBar()` を実装 |
| Scraper | `src/scraping/*.ts`（13本） | `(document) => ScrapedData \| null` の純関数 |
| Domain | `Product` + `Book`/`Doujinshi`/`Film`/`Asmr`/`DLsiteProduct` | データ保持＋Scrapbox 本文生成＋タイトル正規化 |
| Background | `eventPage.ts` | port/message 受信→Scrapbox 検索→存在可否を返す |
| Scrapbox | `src/scrapbox/*` | API クライアント・SearchResult・Page |
| Popup | `src/popup/*` | プロジェクト名・フォーマットテンプレート設定 |

良い点: スクレイパーが純関数に分離されている／フォーマットをユーザーがカスタムできる。

---

## 1. 設計上の主要問題（優先度順・file:line 裏取り済み）

### P1（最重要）メッセージ境界で Product 丸ごと送信→型を失い再構築
- `BaseContentScript.execute()`（[BaseContentScript.tsx:38](../src/contentScript/BaseContentScript.tsx)）が `Product` インスタンスを `port.postMessage` で background に送信。
- クラス情報が消えるため `eventPage.ts:44-50` が `isBook`/`isVideo` で分岐し `makeFromListenerRequest(req: any)` で private フィールドを文字列名参照して復元。
- **だが background が復元後に使うのは `product.titleForSearch`（string）一つだけ**（[eventPage.ts:58](../src/eventPage.ts)）。返信は `searchResult` のみで product は返らず、content script は元の product を保持し続ける。
- 別経路 `scrapboxApi.ts:17` は既に `query: titleForSearch` だけ送っている → **port でも文字列だけ送れば型復元機構一式が不要**。
- この機構の中に **死蔵バグ2件**:
  - **Asmr 誤復元**: `DLsiteManiax.tsx:45` が service=`dlsiteManiax` の Asmr を返すが、`eventPage.ts:44` の else で `Doujinshi` として復元される。
  - **Film 復元バグ**: `Film.makeFromListenerRequest`（[Film.ts:70](../src/Film.ts)）が存在しない `request._actors` を読む。実体は親 `_authors`（`Film.make` → `super(... actors ...)`、[Film.ts:23](../src/Film.ts)）なので undefined になる。
  - 両者とも「background は title しか使わない」ため現状は表面化していない。
- `Book.ts:62` の Dayjs 越境「未検証」TODO も同根。

### P2 Scrapbox 検索経路が二重
- `eventPage.ts` の `onConnect`（port, 詳細ページ用）と `onMessage`（`searchScrapbox`, 一覧ページ用）が並存。SearchResult 組み立てが両方に重複（[eventPage.ts:61](../src/eventPage.ts), [scrapboxApi.ts:31](../src/scrapbox/scrapboxApi.ts)）。
- port 経路は Scrapbox API エラー時にログのみで content へ返さない（[eventPage.ts:91](../src/eventPage.ts)）。onMessage 経路はエラーを返す。挙動が非対称。

### P3 `Product` の God-object 化
- データ保持＋50行の `titleForSearch` 正規表現＋Scrapbox フォーマット整形＋`browser.storage.sync` 直接アクセス（[Product.ts:45](../src/Product.ts)）＋DTO 復元が同居。
- プレースホルダ置換が base と各サブクラスの `replacePlaceholders` に分散。Asmr は `defaultScrapboxFormat` 内テンプレートリテラル直挿しと placeholder 方式が混在。
- title 半角化が constructor と `titleForSearch` で二重。

### P4 「fallback 禁止」方針にスクレイパーが違反
- CLAUDE.md は「セレクターは想像で書かず fallback 禁止（なくなったらテストが落ちるのが理想）」と明記。
- `amazon-scraper.ts` はタイトル7・詳細7・著者7の投機的セレクタ連鎖（[amazon-scraper.ts:26](../src/scraping/amazon-scraper.ts)）。特に `h1` / `.a-color-secondary a` は誤取得しやすい。
- 戻り値契約が不揃い: `publishedAt` が `Date` / `Date|null` / `string|null`(Amazon)。Amazon は string を content script 側で ad-hoc に dayjs 化。CI 判定 `log()` も各スクレイパーに重複。

### P5 新サイト追加が散弾編集（7箇所）
- `constant.ts`（service + isBook/isVideo 配列）/ `manifest.json` / `webpack.common.js` / `eventPage.ts` の declarativeContent / content script / scraper / types。
- declarativeContent ルール（7サイト）と manifest content_scripts（13サイト）がドリフトして二重管理。

### P6 Content Script のボイラープレートと例外処理欠落
- 詳細ページ系13本がほぼ同形のグルー。`scrape()` が `null` を返しても `execute()` が未ガードで送信（[BaseContentScript.tsx:38](../src/contentScript/BaseContentScript.tsx)）→ background は `msg.product` が falsy なら無返信 → **port が無応答で hang**。
- DOM 待ちが各自バラバラ（FanzaBooks `setTimeout(3000)`、FanzaAnime 独自 MutationObserver、DMMBasket/DLsiteCart ポーリング）。
- 一覧ページ系（DMMBasket/DLsiteCart）は `BaseContentScript` を完全バイパスし独自実装。

### P7 リポジトリ衛生・テスト戦略
- **tracked**: `ci-failed-tests.txt`, `failed-tests-patterns.txt` → `git rm --cached` 必要。
- **untracked**: `*-debug-screenshot.png`, `curl`, zip → `.gitignore` 追加で十分（zip は既に未追跡）。
- 純関数スクレイパーなのに HTML フィクスチャのユニットテストが無く、live monitoring 依存で flaky。

### P8 エントリポイント／ビルド基盤が「webpack 時代の取ってつけ」
- **三重の手書き管理＋ドリフト**: webpack entry（15列挙）／manifest content_scripts（13）／eventPage の declarativeContent（7）が別々に手書きで、互いにズレている。
- **副作用モジュール縛り**: 各 content script は末尾 `new X().execute()` の副作用で動き、「1ファイル＝1 webpack エントリ」に固定されている。
- **React がバンドルごとに重複**: ビルド出力で各 content script が約220KB（`react-dom` 533KB がほぼ各バンドルにインライン）。content script は独立注入で実行時にモジュール共有できず、splitChunks では消せない構造的重複。合計 js 約3.3MB。一行バー UI に react-dom は重い。
- **Chrome/Firefox 切替が旧式**: `wext-manifest` の `__chrome__`/`__firefox__` プレフィックス＋`TARGET_BROWSER` 環境変数。
- 2つの直交軸に分解できる: **軸A=ビルド/エントリ基盤**（手書き列挙・manifest 生成・クロスブラウザ）、**軸B=ランタイム重量**（React×15 重複、バー UI に react-dom が要るか）。

### その他の設計リスク（Codex 指摘・要対応）
- **storage cache stale**: `eventPage.ts:21` は起動時に一度だけ `storage.sync.get(null)`。popup で projectName を変えても service worker 生存中は古い値を使う。
- **`scrapboxApi.ts` だけ `chrome.runtime` 直叩き**（callback 式、[scrapboxApi.ts:17](../src/scrapbox/scrapboxApi.ts)）。他は `webextension-polyfill`。Promise 化・エラー処理・テスト容易性・Firefox 互換のため寄せる価値あり。
- **`SearchResult.existsExactTitleMatch`**（[SearchResult.ts:5](../src/scrapbox/SearchResult.ts)）は型にあるが domain object に保持されず未使用。判定は `count >= 1` のみ（[eventPage.ts:80](../src/eventPage.ts)）。`titleForSearch` は最大4語に丸めるため false positive の余地 → **これはリファクタでなくプロダクト仕様。別 Issue で扱う**。

---

## 2. 目標アーキテクチャ

```
[site registry]  ← 単一の真実: host → { matches, contentScript, scraper, productFactory }
       │
content script (薄いエントリ) ──scrape()──▶ scraper (純関数: Document→ScrapedData)
       │                                          │
       │                               productFactory(ScrapedData)→Product
       │
       ├─ titleForSearch(product.title) を計算（純モジュール）
       ▼
   検索リクエスト: { query: titleForSearch }   ← Product は送らない（plain DTO のみ）
       │
   background: 単一の ScrapboxSearchService（経路1本・エラーも DTO 化）
       ▼
   レスポンス: { status, projectName, searchResultDto }
       │
   content script が保持済み Product でバー描画 / 本文生成（ScrapboxFormatter）
```

設計原則:
1. プロセス境界を流れるのは plain DTO（string / 最小 JSON）だけ。リッチな Product は越境させない。
2. Product はデータ＋整形のみ。タイトル正規化・フォーマット整形・ストレージ読込を独立モジュールへ。
3. 検索経路は1本。失敗状態も DTO で返す。
4. サイトレジストリで追加箇所を集約。

---

## 3. フェーズ計画（Codex レビュー反映・確定）

> 着手順: **Phase0 → Phase1 → Phase7a(基盤判断 PoC/ADR) → Phase1.5 → Phase6(前倒し) → Phase3 → Phase2 → Phase4 → Phase5(判断に従属) → Phase7b(本移行) → Phase8**
> ポイント1: 挙動が変わりうる改修（Amazon fallback 削減・Product 分解）の**前に**フィクスチャテストで現状を固定する。
> ポイント2: ビルド基盤の**判断（7a）は早期**に（Phase5 の作り込みを左右するため）、**本移行（7b）はテスト網の後**に。判断と本移行を分離する。詳細は下記「フェーズ順序の根拠」を参照。

### Phase 0 — リポジトリ衛生（低リスク・即効）
- tracked な生成物を除去: `git rm --cached ci-failed-tests.txt failed-tests-patterns.txt`。
- `.gitignore` に追加: `*.zip`, `*-debug-screenshot.png`, `playwright-report/`, `test-results/`, `/curl`, `*-failed*.txt`。
- `*-specific-debug.test.ts` は**残すが monitoring 配下の debug 用ディレクトリへ集約**（決定済み）。
- **効果**: 以降の diff が読みやすくなり、リファクタの安全性が上がる。

### Phase 1 — メッセージング境界の DTO 化（P1 / 最重要・最初の本丸）
1. 送るペイロードを `{ query: titleForSearch }`（string）に変更し、`UniPostMessage.product`（Product 丸ごと送信）を廃止。トランスポートも `sendMessage` へ寄せる前提で配線（Phase1.5 で経路統合・port 全廃と接続）。
2. `eventPage.ts` から `makeFromListenerRequest` 呼び出し・`isBook/isVideo` 分岐を削除。各ドメインの `makeFromListenerRequest`（4箇所）も削除 → **Asmr/Film 死蔵バグ・Dayjs 越境 TODO が同時消滅**。
3. **storage cache 廃止**: background はリクエストごとに `projectName` を読む、または `storage.onChanged` で更新（stale 解消）。
4. `execute()` に null ガード: `scrape()` が null なら描画・送信せず終了（port hang 解消）。
5. port 経路のエラーを失敗 DTO で content へ返す（onMessage 経路と非対称を解消）。
- **テスト**: `titleForSearch → 検索クエリ` の small 単体、`access-check` large は維持。
- **効果**: 最大の負債が消えコード量が大幅減。後続の土台。

### Phase 1.5 — Scrapbox 検索経路の統合（P2）
- `onConnect` と `onMessage` を単一の `ScrapboxSearchService` に統合し、SearchResult 組み立ての重複を解消。`scrapboxApi.ts` もこのサービスを使う。
- **トランスポートは sendMessage 一本化（決定済み）**。詳細ページの port（`runtime.connect`）を廃止し、`browser.runtime.sendMessage({ action, query })` に統一。`onConnect` リスナと各 content script の `connect()`/`disconnect()` 配線を削除。
- リクエスト/レスポンスを DTO で型付け: req `{ action: "searchScrapbox", query }`、res `{ status: "ok" | "error", projectName, searchResult? , error? }`。エラー時も必ず返す（現状 port 経路の無返信を解消）。

### Phase 6（前倒し）— フィクスチャテストの導入（安全網）
- message contract（Phase1 の DTO）に対するテスト。
- 主要スクレイパーに、実 HTML を1度だけ記録した**フィクスチャ + jsdom のユニットテスト**を `small` に追加。純関数なので相性が良い。
- live large テストは「アクセス可否 / セレクタ生存確認」に役割を絞る（IP 制限 `allowIpBlock` 方針は維持）。
- **効果**: Phase3/Phase2 の挙動変化を検知できる安全網を先に張る。

### Phase 3 — スクレイパー契約の統一（P4）
1. `ScrapedData.publishedAt` を統一型に（推奨: パース済み `Date | null` + 共通 `parsePublishedAt`）。Amazon content script 側の ad-hoc パースを撤去。
2. CI 判定 `log()` を `src/scraping/utils/logger.ts` に共通化。
3. 散在する型を `src/scraping/types.ts` に集約。
4. **Amazon の投機的 fallback セレクタを削減（確認済み DOM バリアントごとに1セレクタ）**。Playwright で実 DOM を確認し、原則1セレクタ。実在が確認できる複数レイアウト（箇条書き `#detailBullets_feature_div` / テーブル `#productDetails...`）のみそれぞれ1セレクタを許容。`h1` や `.a-color-secondary a` のような投機的セレクタは全廃し、落ちたら気づける状態にする。

### Phase 2 — Product の責務分離（P3）
1. `titleForSearch` の正規表現を `src/domain/titleForSearch.ts` の純関数に抽出（`title-normalization.test.ts` をこちらへ）。
2. プレースホルダ置換を `src/domain/ScrapboxFormatter.ts` に集約。各サブクラスの override を `toTemplateVars(): Record<string,string>` ベースの一元置換に置換。Asmr のテンプレートリテラル直挿しも統一。
3. `createScrapboxBodyString` 内の `browser.storage.sync` 読込を呼び出し側（popup/organism）へ追い出す（DI）。
- **効果**: ドメインが拡張 API 非依存になりユニットテスト容易化。

### Phase 4 — Content Script の共通化（P6 残り）
- DOM 待ちの共通化（`waitForElement`/`waitForSelector`）で `setTimeout(3000)` 等を置換。
- 詳細ページ系を `createProduct: (ScrapedData)=>Product` を渡すだけの宣言的エントリへ（テンプレートメソッド→構成）。
- 一覧ページ系（DMMBasket/DLsiteCart）の共通パターン（observer + per-item 検索 + リンク注入）を `ListPageContentScript` 基底に抽出。

### Phase 7a（評価・判断フェーズ）— ビルド/エントリ基盤の方針決定（P8・軸A / Phase1 直後・早期）
> **本移行ではなく「どの基盤に行くか」を1サイト PoC で決めて ADR に落とすだけ**。安価で、Phase 5 の作り込み方を左右するため早期に置く。
- 3案を1サイトだけ移植して計測・比較:
  1. **webpack 維持 ＋ レジストリ駆動生成**（移行リスク最小）
  2. **Vite + @crxjs/vite-plugin**（HMR・高速ビルド・entry 半自動）
  3. **WXT（wxt.dev）**: `entrypoints/` 規約で content script を自動 discovery、manifest 自動生成、Chrome/Firefox クロスブラウザ、Vite 基盤。本プロジェクトの構造（多サイト content script ＋ 両ブラウザ）に最も合うが移行コスト最大。
- 評価軸: 手書き管理の削減度／クロスブラウザ生成（現 `__chrome__`/`__firefox__` 置換）／HMR・DX／バンドルサイズ／移行コスト・後戻り可能性。
- **アウトプット**: ADR（採用案＋根拠）。これにより Phase 5 と Phase 7b のスコープが確定する。
- 推奨スタンス: WXT を本命候補として PoC、ただし採否は計測後。

### Phase 5 — サイトレジストリ化（P5・軸A / **Phase 7a の判断に従属**）
- `src/sites/registry.ts` に `{ service, hostPatterns, productType, entry }` を集約（どの基盤でも資産として生きる）。
- declarativeContent と manifest content_scripts の二重管理を解消。
- **スコープは 7a の決定次第**:
  - 7a=「webpack 維持」なら **entry/manifest をレジストリから生成する自前ジェネレータを実装**（軸A の本命対応）。
  - 7a=「WXT/Vite 採用」なら **自前ジェネレータは作らない**（フレームワークが entry/manifest を担うため）。レジストリは productFactory 等のドメイン用途に縮小し、Phase 7b で WXT の `entrypoints/` 規約へ寄せる。

### Phase 7b（本移行フェーズ）— ビルド基盤の移行実施（軸A / **テスト網の後**・任意）
> 7a で webpack 以外を選んだ場合のみ。Phase 6 のフィクスチャ網が揃ってから着手し、**挙動を凍結したまま（ファイル移動とビルド差し替えのみ・ロジック変更なし）**移行。Chrome/Firefox 両方で読み込み確認してから完了とする。
- `new X().execute()` の副作用エントリを採用基盤の規約（例: WXT の `defineContentScript`）へ移す。`BaseContentScript` クラスや scraper はそのまま再利用。
- 2つの大きな変数を同時に動かさない（ランタイムは Phase1〜5 で安定済み・テスト済みであること）。

### Phase 8（評価フェーズ）— バー UI のランタイム軽量化（P8・軸B / Phase 7 と独立）
- react-dom（533KB）が15 content script に重複インラインしている問題。バー（AlertBar / CreatePageBar）は一行 UI で react-dom はオーバースペック。
- 選択肢: **Preact 代替**（`preact/compat` で React API ほぼ維持、数KB級）／**vanilla DOM 化**（最軽量だが書換量大）。
- まず1サイトで PoC してバンドル削減量と保守性を計測。Phase 7（ビルド基盤）とは独立に差し込み可能。
- 注意: popup は React のままでよい（重複問題は content script 側のみ）。

---

## 4. 着手順とリスク

| 順 | フェーズ | リスク | 効果 |
|---|---|---|---|
| 1 | Phase 0 衛生 | 極低 | diff 可読性↑ |
| 2 | **Phase 1 DTO化** | 中（境界変更） | **最大の負債解消＋死蔵バグ除去** |
| 3 | **Phase 7a 基盤判断（PoC/ADR）** | 低（評価のみ） | Phase5/7b のスコープ確定・DX 方針決定 |
| 4 | Phase 1.5 経路統合 | 中 | 重複・エラー非対称解消 |
| 5 | Phase 6 フィクスチャ | 低 | 以降の安全網 |
| 6 | Phase 3 scraper契約 | 中（Amazon 挙動変化注意） | 保守性↑ |
| 7 | Phase 2 Product分離 | 中 | テスト容易化 |
| 8 | Phase 4 content script 共通化 | 中 | 拡張容易化 |
| 9 | Phase 5 registry（7a に従属） | 中 | ドリフト解消・追加箇所集約 |
| 10 | Phase 7b 本移行（7a で非 webpack 選択時のみ） | 大 | 手書き管理撤廃・HMR/DX↑ |
| 11 | Phase 8 バー UI 軽量化（Preact/vanilla） | 評価→中 | バンドル激減（軸B・Phase7 と独立） |

### フェーズ順序の根拠（判断と本移行の分離）
- **判断（7a）を早期に置く理由**: WXT/Vite を採ると entry/manifest 生成はフレームワークが担うため、Phase 5 で自前ジェネレータを作り込むと**後で丸ごと捨てる**ことになる。7a と最も強く結合するのは Phase 5。よって 7a を Phase 5 の前に置き、Phase 5 のスコープを判断に従属させる。
- **本移行（7b）を後に置く理由**: ランタイムがまだ不安定／無テストの段階で基盤移行も重ねると「移行のせい？リファクタのせい？」が切り分け不能。Phase 6 のテスト網を張り、ランタイムを Phase1〜5 で安定させてから、挙動凍結で移行する。
- **Phase 1 を判断より前に置く理由**: P1 の死蔵バグ一掃は高価値かつ基盤非依存。早期に出す。
- **再利用される資産**: `BaseContentScript`・scraper 純関数・`src/sites/registry.ts` のドメイン部分はどの基盤でも生き残るため、7b 採否に関わらず先行して整備してよい。捨てになりうるのは「自前 manifest/entry ジェネレータ」だけ。

## 5. リファクタとは別に切り出す Issue
- `titleForSearch` の4語丸めによる「もう買ってるかも」false positive の仕様（`existsExactTitleMatch` を実際に使うか含め検討）。※トランスポート一本化（sendMessage）は本計画 Phase1.5 に確定済みのため Issue から除外。
