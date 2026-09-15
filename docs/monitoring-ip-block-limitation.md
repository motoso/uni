# Daily 監視テストの IP ブロック制限（重要な前提）

## 要約

一部のサイト（**Melonbooks / Surugaya**）は、**GitHub Actions のどのIPからも安定してアクセスできない**。

| 接続元                                               | 結果                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 海外IP（`@global` 通常ジョブ、Wyoming等）            | HTTP **403**（地理ブロック）                                                                     |
| 日本IP（`@japan` ProtonVPN無料版・データセンターIP） | HTTP **403**（Cloudflare のデータセンターIPブロック）。**断続的** — 割り当てIP次第で通る日もある |
| 手元の日本住宅用IP                                   | HTTP **200**（正常）                                                                             |

つまり 403 の原因は **HTMLの構造変更ではなく、アクセス元IPの素性（住宅用 vs データセンター）** にある。`requiresJapanIP: true`（VPN日本IPジョブへ移動）だけでは解決しない。データセンターIPである限り Cloudflare は地理に関係なく403を返す。

Toranoana は別の地域制限パターンで、海外の GitHub Actions runner には HTTP **503**、日本の接続元には HTTP **200** を返す。このため `requiresJapanIP: true` とし、`@japan` の VPN ジョブで監視する。Toranoana の 503 は `allowIpBlock` では skip しない。日本 VPN でも到達できなくなった場合は、構造監視ができない異常として検知する。

## このリポジトリでの扱い

`SiteConfig.allowIpBlock: true` を付けたサイトは、ヘルスチェックが **HTTP 403** を返したとき、テスト**失敗ではなく skip** する。

また、HTTP 200 でも商品ページから既知の一時停止ページへ転送された場合は、DOM 構造を検証できない。`SiteConfig.transientUnavailableUrlPatterns` に URL パターンを明示したサイトでは、最終 URL が一致したときも skip する。現在は Surugaya の `https://cdn.suruga-ya.jp/maintenance/maintenance.html` を対象にしている。

- 実装: `src/__tests__/support/monitoring-health-check.ts` の `isEnvironmentalIpBlock()` / `isTransientlyUnavailable()`
- 適用: 403 判定は `static-sites.test.ts` / `spa-sites.test.ts`、メンテナンス URL 判定は `static-sites.test.ts` の各テスト（selector検証 × Chromium/Firefox、および挿入位置検証）
- 現在 `allowIpBlock: true` のサイト: **Melonbooks**, **Surugaya**

判断の根拠: **403 や既知のメンテナンスページは、商品ページの `STRUCTURE_ERROR`（HTML構造の変更）ではない**。構造監視という本来の目的に対してこれらはノイズなので、商品ページを取得できたときだけ selector を検証する。

## ⚠️ リスク（今後の調査で必ず踏まえること）

この skip は **以下のケースも黙って見逃す**:

1. サイトが**永続的に**我々をブロックするようになった場合（一時的なIPブロックと区別できない）。
2. **403 やメンテナンスページの裏でHTML構造が変わっていた**場合（skip するため selector 検証に到達しない）。

したがって、**403 またはメンテナンス転送が継続するサイトについては、日本の住宅用IP（手元環境）から手動でアクセスし、selector が現行のままか確認すること**。CIの skip は「構造OK」を意味しない。

## 手動確認の例

```bash
# 手元（日本住宅用IP）では 200 が返るはず
curl -s -o /dev/null -w "Melonbooks HTTP: %{http_code}\n" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  "https://www.melonbooks.co.jp/detail/detail.php?product_id=3193504"
```

200 が返ったら、ブラウザ/Playwright で実際のDOMを開き、`shared.ts` の該当 `selectors` が存在するか確認する。

## CIと手元でDOMが異なる場合

接続元によって年齢認証の言語、ログイン要求、リダイレクト先が変わる場合がある。
FANZAでは日本語・英語の年齢認証ページが観測されている。過去のボタン名や
特定runnerの所在地を前提にせず、失敗した環境で最終URLと実DOMを確認する。

現行の `handleAgeVerification()`（`src/__tests__/large/monitoring/shared.ts`）は
年齢認証・ログインページに残った場合に失敗とする。ログインページに到達しても
商品DOMを検証したことにはならない。環境要因を切り分け、スクレイピング成功と区別する。

調査時は失敗したサイト・テストに絞る。抽出済みの失敗は `npm run test:failed-only`、
直接指定する場合は `npm run test:large -- --grep "<test pattern>"` を使う。
対象を変更した場合は、その変更を検証するテストも実行する。

[Debug CI Environment](../.github/workflows/debug-ci-environment.yml) は手動実行用。
`debug_target` でサイト、`test_type` で調査対象を選ぶ。`test_pattern` を指定すると
そちらが優先される。利用できる選択肢と実行内容はworkflowを参照する。
このworkflowはVPNを設定しないため、日本IPでの再現確認には別途適切な接続元が必要。

既存の `fanza-debug.test.ts` / `amazon-debug.test.ts` と実行ログ・スクリーンショットを
使い、最終URL、HTML、ボタン要素、selectorの成否を調べる。
通常の `playwright.config.ts` のテスト対象を狭める必要はない。

## VPN監視の設定

[Daily Tests](../.github/workflows/daily-tests.yml) は通常接続の `@global` と
日本VPN経由の `@japan` を分けて実行する。サイトの分類は `shared.ts` の
`requiresJapanIP` を参照する。VPN対象はFANZAに限定しない。

VPNはGluetun / ProtonVPNを使用する。設定時はProtonVPNでWireGuard設定を生成し、
PrivateKeyをGitHub Secret `PROTONVPN_WIREGUARD_PRIVATE_KEY` に保存する。
接続設定・プロキシのポートと環境変数はworkflowを参照する。
日次以外に実行するときは `Daily Tests (Large & VPN)` を手動実行する。
VPNで日本IPになっても、上記のデータセンターIPブロックは残り得る。

## 関連

- Amazon は別要因（ボット検出/CAPTCHA）で監視対象外。`docs/amazon-vpn-test-investigation.md` 参照。
