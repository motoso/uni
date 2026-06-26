# uni リファクタリング計画（Phase 1 完了後）

> 更新: 2026-06-26 / 最新 `main` (`af3e6fb`, `[codex] Refactor Scrapbox search message boundary`) を基準に再定義。
> Phase 1（Product 丸ごと越境の廃止、検索 query DTO 化、null ガード、background の projectName 再読込、port 経路エラー応答）は完了済み。
> Phase 1.5（検索境界の完全 DTO 化、`sendMessage` 一本化、port 経路廃止）は完了済み。
> 今後はフル Clean Architecture ではなく、uni の規模に合わせた **DDD-lite + 最小 port 境界** を採用する。

## 0. 現在地

`uni` は Chrome / Firefox 向けのブラウザ拡張で、対応 EC / メディアサイトの商品ページから書誌情報を読み取り、Cosense(Scrapbox) に蔵書ページを作成・既存ページを検出する。

Phase 1 の結果、最大の負債だった「`Product` インスタンスを background へ送って型を失い、`Book`/`Film`/`Asmr` へ復元する」経路は解消済み。Phase 1.5 の結果、検索経路は `browser.runtime.sendMessage` に統一され、background に渡る検索入力は `action` と `query` だけになっている。

現在の主要構成:

| 領域           | ファイル                                                     | 現状                                                                       |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Content Script | `src/contentScript/*.tsx`                                    | サイトごとの注入エントリ。`Product` は content script 側に留まる           |
| Scraper        | `src/scraping/*.ts`                                          | `Document -> ScrapedData \| null` の入力アダプタ                           |
| Product        | `Product` + `Book`/`Doujinshi`/`Film`/`Asmr`/`DLsiteProduct` | まだタイトル正規化・本文生成・storage 読込が同居                           |
| Background     | `src/eventPage.ts`                                           | `onMessage` で検索 request/response DTO を処理                             |
| Scrapbox       | `src/scrapbox/*`                                             | API response 型、検索 DTO、content-side message client                     |
| Popup/UI       | `src/popup/*`, `src/organism/*`                              | 設定 UI と content script のバー UI                                        |

## 1. 設計判断

1. **フル Clean Architecture は採用しない。**
    - uni の現時点の usecase はほぼ「Scrapbox検索」と「Scrapbox本文生成」に限られる。
    - `presentation/usecase/ports/infrastructure` の全面フォルダ移動は、WXT/Vite などのビルド基盤移行と衝突しやすい。
    - CircleCart / hampu の ADR-011 からは「依存方向をCIで守る」思想だけを取り込む。
2. **DDD-lite + 最小 port 境界を採用する。**
    - 純粋ロジックは browser / React / network / storage 非依存にする。
    - 外部I/Oは薄い port 名を付ける。ただし過剰な Repository 層は作らない。
3. **Scraper は domain ではなく入力アダプタとして扱う。**
    - 各サイト固有の DOM 知識は `src/scraping` / 将来の `src/sites` に閉じ込める。
    - `Product` 生成とは契約を分ける。
4. **Scrapbox `SearchResult` / `Page` は core domain ではなく Scrapbox context として扱う。**
    - 検索レスポンスは plain DTO で越境する。
    - class instance を message boundary に流さない。
5. **方向性はCIで守る。**
    - `dependency-cruiser` を `npm run dep:check` として導入。
    - 現在は background / scraper / 将来の domain-usecase-ports 境界を error でチェックする。
    - 本格的な層フォルダができたらルールを段階的に強化する。

## 2. 残っている主要問題

P1 / P2 は Phase 1.5 で解消済み。残課題は以下。

### P3 `Product` の責務過多

`Product` は以下を同時に持っている。

- データ保持
- `titleForSearch` の正規化
- Scrapbox本文テンプレート展開
- `browser.storage.sync` からフォーマットを読む副作用

domainに近い純粋ロジックと extension infrastructure が混ざっているため、テストしづらく、将来の本文生成 usecase も見えにくい。

### P4 スクレイパー契約が不揃い

- `publishedAt` の型が scraper ごとに `Date`, `Date | null`, `string | null` で揺れている。
- Amazon scraper に投機的 fallback selector が多い。
- logging / CI 判定用の出力が scraper ごとに散っている。
- フィクスチャ unit test が少なく、live monitoring への依存が高い。

### P5 新サイト追加が散弾編集

site の定義が `constant.ts`, `manifest.json`, `webpack.common.js`, `eventPage.ts`, content script, scraper, tests に分散している。ビルド基盤判断前に自前 generator を作り込むと捨て作業になりうるため、Phase 7a の判断に従属させる。

### P6 Content Script のボイラープレート

詳細ページ系は同形の `scrape()` / `createElementForBar()` / `execute()` が並ぶ。一覧ページ系は `BaseContentScript` と別実装。DOM待ちも `setTimeout`, MutationObserver, polling が散在している。

### P7 ビルド基盤と content script ランタイム重量

webpack entry / manifest content_scripts / declarativeContent が手書きでドリフトしやすい。さらに content script ごとに `react-dom` が重複し、一行バー UI に対してランタイムが重い。

## 3. 目標アーキテクチャ

大きな層フォルダへ即移動するのではなく、まず依存方向を明確にする。

```
site content script
  -> scraper(Document -> ScrapedData)
  -> productFactory(ScrapedData -> Product)
  -> titleForSearch(product.title)
  -> SearchBibliographyMessageClient(sendMessage DTO)

background message handler
  -> SearchBibliography usecase-ish function
       -> SettingsReader(projectName)
       -> ScrapboxSearchGateway(query)
       -> SearchResultDto

content script UI
  -> SearchResultDto
  -> AlertBar / CreatePageBar
  -> Product kept locally for page body generation
```

依存方向:

```
contentScript / popup / organism  -> usecase-ish functions -> pure modules
background handler                -> gateway/settings abstractions -> concrete browser/ky I/O
scraping                          -> ScrapedData only
```

将来 `src/domain`, `src/usecase`, `src/ports`, `src/infrastructure` を作る場合の原則:

- `src/domain`: browser, chrome, React, ky, storage, message DTO を import しない。
- `src/usecase`: domain と ports だけに依存し、UI / concrete infrastructure へ依存しない。
- `src/ports`: interface / type のみ。browser, ky, React に依存しない。
- `src/infrastructure`: browser storage, runtime messaging, Scrapbox HTTP, mappers を持つ。

## 4. CIガードレール

hampu と同じ考え方で、方向性チェックをCIに入れる。

追加済み:

- `.dependency-cruiser.cjs`
- `npm run dep:check`
- `.github/workflows/test.yml` の `Architecture dependency check`

現時点の error ルール:

- circular dependency 禁止。
- unresolved dependency 禁止。
- `eventPage.ts` は `Product`/UI/contentScript/scraper を import しない。
- `src/scraping` は `Product`/UI/extension API/Scrapbox を import しない。
- 将来の `src/domain` は browser/UI/network/storage/transport に依存しない。`react`, `react-dom`, `ky`, `webextension-polyfill`, `dayjs` などの runtime npm package も直接 import しない。
- 将来の `src/usecase` は presentation / concrete infrastructure に依存しない。UI / extension runtime / HTTP client の npm package も直接 import しない。
- 将来の `src/ports` は concrete implementation に依存しない。UI / extension runtime / HTTP client の npm package も直接 import しない。

注意:

- `dependency-cruiser` は import graph を見るため、`chrome` / `browser` の global 直接参照は検出できない。domain / usecase の純粋性をより強く守る段階では、ESLint の `no-restricted-globals` / `no-restricted-imports` 相当を追加する。

運用方針:

- 新しい境界を作るPRでは、同じPRで dependency-cruiser ルールも追加・強化する。
- 最初から全ルールを強すぎる error にしない。既存構造で守れる方向だけ error にする。
- Warning で放置するより、狭い error ルールを少しずつ増やす。

## 5. フェーズ計画（Phase 1以後）

着手順:

**Phase 7a → Phase 6 → Phase 3 → Phase 2 → Phase 4 → Phase 5 → Phase 7b → Phase 8**

Phase 1 / Phase 1.5 は完了済みとして扱う。次は Phase 5 の作り込み方を左右する Phase 7a を優先する。

### Phase 1.5 — 検索境界の完全 DTO 化と sendMessage 一本化（完了）

実施済み:

- `SearchResultDto`, `ScrapboxPageDto`, `SearchBibliographyRequestDto`, `SearchBibliographyResponseDto` を追加。
- 詳細ページ・一覧ページの検索経路を `browser.runtime.sendMessage` に統一。
- background の検索 handler を `onMessage` に集約し、成功/失敗レスポンスを `{ status: "ok" | "error" }` に統一。
- `runtime.connect` / `onConnect` / `makeFromListenerRequest` を production code から削除。
- DTO 化により参照ゼロになった `SearchResult` / `Page` class（および `GetPagesSearchResponseInterface` alias）を削除。`SearchProps.projectName` の dead field も除去。
- `scrapboxApi.ts` を `webextension-polyfill` Promise API に変更。

目的:

- `SearchResult` / `Page` class instance を message boundary から消す。
- port を廃止し、詳細ページ・一覧ページを `browser.runtime.sendMessage` に統一する。
- 一覧ページ側で既に使っている `sendMessage + raw Scrapbox API DTO` の方向に寄せ、二重経路を同じレスポンス DTO に統一する。
- background 側の検索処理を1つの handler / usecase-ish function に集約する。

作業:

0. 既存 detail page port flow の `existPages` mapping（`/{projectName}/{title}` と Scrapbox URL）を small characterization test で固定する。
1. `SearchResultDto`, `ScrapboxPageDto`, `SearchBibliographyRequestDto`, `SearchBibliographyResponseDto` を定義。
2. `UniPostMessage.searchResult?: SearchResult` を廃止し、plain DTO だけを返す。
3. `SearchResult.makeFromListenerRequest` / `Page.makeFromListenerRequest` を削除。
4. `BaseContentScript` の `runtime.connect` / `port.disconnect` を `browser.runtime.sendMessage` に置換。
5. `eventPage.ts` の `onConnect` を削除し、`onMessage` に一本化。
6. `scrapboxApi.ts` を `webextension-polyfill` Promise API に寄せ、content-side message client として整理。
7. 成功レスポンスは `{ status: "ok", projectName, searchResult }`、失敗レスポンスは `{ status: "error", error }` に統一。

テスト:

- small: detail page content script が `sendMessage({ action, query })` だけ送る。
- small: background handler が count に応じて同じ DTO shape を返す。
- small: Scrapbox API エラー時も必ず error DTO を返す。
- dep:check: background が Product/UI に依存しないことを維持。

完了条件:

- `runtime.connect` / `onConnect` が production code から消える。
- `makeFromListenerRequest` が production code から消える。
- `SearchResult` class が message DTO として使われない。

### Phase 7a — ビルド/エントリ基盤の方針決定 ADR

目的:

- Phase 5 の registry / manifest 生成を自前で作るべきか、WXT/Vite の規約に任せるべきかを先に決める。

比較対象:

1. webpack 維持 + registry-driven generation
2. Vite + `@crxjs/vite-plugin`
3. WXT

評価軸:

- content script entry の手書き削減度
- Chrome/Firefox manifest 生成
- HMR / dev server / build time
- bundle size
- 既存 `BaseContentScript` / scraper の再利用度
- 後戻り可能性

アウトプット:

- `docs/adr/002-...md` として採用案・不採用案・Phase 5/7b への影響を書く。

### Phase 6 — フィクスチャテストの導入

目的:

- Phase 3 / Phase 2 の挙動変更前に、主要 scraper の現状を small test で固定する。

作業:

1. 主要サイトの代表 HTML を fixture として保存。
2. `Document -> ScrapedData` の jsdom small test を追加。
3. live large test は「アクセス可否 / セレクタ生存監視」に役割を絞る。

優先:

- Amazon
- FANZA Books / Doujin / Video
- DLsite Books / Maniax
- BookWalker

### Phase 3 — Scraper契約の統一

目的:

- scraper を入力アダプタとして安定させる。

作業:

1. `ScrapedData.publishedAt` を `Date | null` に統一。
2. Amazon content script 側の ad-hoc dayjs parse を scraper / 共通 parse helper 側へ移す。
3. logging を `src/scraping/utils/logger.ts` に集約。
4. 散在する scraped data 型を `src/scraping/types.ts` に整理。
5. Amazon の投機的 fallback selector を、fixture / live DOM で確認済みの selector に削減する。

### Phase 2 — Product責務分離

目的:

- `Product` を browser API 非依存に近づけ、本文生成と正規化を純粋ロジックとしてテストしやすくする。

作業:

1. `titleForSearch` を `src/domain/titleForSearch.ts` へ抽出。
2. placeholder 展開を `ScrapboxFormatter` に集約。
3. 各 product class は `toTemplateVars()` と default format を提供するだけに寄せる。
4. `createScrapboxBodyString` の `browser.storage.sync` 読込を呼び出し側へ移す。
5. `Product` constructor と `titleForSearch` の半角化重複を解消する。

CI強化:

- `src/domain` 作成後、`domain-must-stay-browser-free` が実効ルールになる。
- `Product.ts` が `browser` を import しなくなった段階で、旧 root `Product` 系にも同等ルールを追加する。

### Phase 4 — Content Script共通化

目的:

- 各サイトのエントリを薄くし、DOM待ちとバー描画の重複を減らす。

作業:

1. `waitForElement` / `waitForSelector` を共通化。
2. 詳細ページ系を `{ service, scrape, createProduct, mountPoint }` の宣言的設定に寄せる。
3. 一覧ページ系（DMMBasket / DLsiteCart）の observer + per-item 検索 + リンク注入を共通化する。

注意:

- Phase 7b で entrypoint 規約が変わる可能性があるため、ファイル移動は最小限にする。

### Phase 5 — サイトレジストリ化

目的:

- 新サイト追加時の散弾編集を減らす。

Phase 7a の結論に従う:

- webpack 維持なら、registry から webpack entry / manifest / declarativeContent を生成する。
- WXT/Vite 採用なら、自前 generator は作らず、framework の entrypoint / manifest 規約に寄せる。

最低限どの案でも残す情報:

- service
- host / match pattern
- product type
- scraper
- product factory
- content script entry

### Phase 7b — ビルド基盤の本移行

目的:

- Phase 7a で webpack 以外を選んだ場合のみ、挙動凍結で移行する。

条件:

- Phase 6 の fixture test が主要サイトに入っている。
- Phase 1.5 の message boundary が一本化済み。
- 移行PRではロジック変更を混ぜない。

### Phase 8 — バー UI ランタイム軽量化

目的:

- content script ごとの `react-dom` 重複を削減する。

選択肢:

- Preact compat
- vanilla DOM

進め方:

- 1サイトだけ PoC し、bundle size と保守性を比較する。
- popup は React 維持でよい。対象は content script のバー UI のみ。

## 6. リファクタとは別に切り出す Issue

- `titleForSearch` の4語丸めによる「もう買ってるかも」false positive。
- `SearchResult.existsExactTitleMatch` を実際に使うかどうか。
- `count >= 1` 判定を厳密化する仕様判断。
