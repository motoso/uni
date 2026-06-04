# Daily 監視テストの IP ブロック制限（重要な前提）

## 要約

一部のサイト（**Melonbooks / Surugaya**）は、**GitHub Actions のどのIPからも安定してアクセスできない**。

| 接続元 | 結果 |
|---|---|
| 海外IP（`@global` 通常ジョブ、Wyoming等） | HTTP **403**（地理ブロック） |
| 日本IP（`@japan` ProtonVPN無料版・データセンターIP） | HTTP **403**（Cloudflare のデータセンターIPブロック）。**断続的** — 割り当てIP次第で通る日もある |
| 手元の日本住宅用IP | HTTP **200**（正常） |

つまり 403 の原因は **HTMLの構造変更ではなく、アクセス元IPの素性（住宅用 vs データセンター）** にある。`requiresJapanIP: true`（VPN日本IPジョブへ移動）だけでは解決しない。データセンターIPである限り Cloudflare は地理に関係なく403を返す。

## このリポジトリでの扱い

`SiteConfig.allowIpBlock: true` を付けたサイトは、ヘルスチェックが **HTTP 403** を返したとき、テスト**失敗ではなく skip** する。

- 実装: `src/__tests__/large/monitoring/shared.ts` の `isEnvironmentalIpBlock()`
- 適用: `static-sites.test.ts` / `spa-sites.test.ts` の各テスト（selector検証 × Chromium/Firefox、および挿入位置検証）
- 現在 `allowIpBlock: true` のサイト: **Melonbooks**, **Surugaya**

判断の根拠: **403 は `NETWORK_ERROR`（ページすら読めていない）であって `STRUCTURE_ERROR`（HTML構造の変更）ではない**。構造監視という本来の目的に対して 403 はノイズなので、200 が返ったときだけ selector を検証し、403 のときは skip する。

## ⚠️ リスク（今後の調査で必ず踏まえること）

この skip は **以下のケースも黙って見逃す**:

1. サイトが**永続的に**我々をブロックするようになった場合（一時的なIPブロックと区別できない）。
2. **403 の裏でHTML構造が変わっていた**場合（403で skip するため selector 検証に到達しない）。

したがって、**403 が継続するサイトについては、日本の住宅用IP（手元環境）から手動でアクセスし、selector が現行のままか確認すること**。CIの skip は「構造OK」を意味しない。

## 手動確認の例

```bash
# 手元（日本住宅用IP）では 200 が返るはず
curl -s -o /dev/null -w "Melonbooks HTTP: %{http_code}\n" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  "https://www.melonbooks.co.jp/detail/detail.php?product_id=3193504"
```

200 が返ったら、ブラウザ/Playwright で実際のDOMを開き、`shared.ts` の該当 `selectors` が存在するか確認する。

## 関連

- 地理的IP制限の背景は `CLAUDE.md`（CI環境と手元環境の違い）も参照。
- Amazon は別要因（ボット検出/CAPTCHA）で監視対象外。`docs/amazon-vpn-test-investigation.md` 参照。
