---
name: uni-delivery
description: uniのPR作成・更新・マージ、またはChrome／Firefoxのリリースを行うときに使う。
---

# uniのPR・リリース運用

依頼された操作に該当する節を使い、コマンドはリポジトリルートで実行する。
PR作成だけの依頼をマージやストア公開まで広げない。

## Pull Requests

- 対象は `motoso/uni`、ベースブランチは `main`。変更はPR経由で取り込む。
- PRテンプレートがある場合は使用する。本文は変更の目的・理由・検証結果を説明する。
  `create-explanatory-pr` スキルが利用可能なら、タイトル・本文の作成に使う。
- PR作成・更新前に `npm run fmt` と `npm test` を実行する。
  Largeはスクレイピング・selector・年齢認証・サイト固有ContentScriptを変更した場合に対象を絞って実行する。
- [Fast Tests](../../../.github/workflows/test.yml) はPrettier、依存境界、Small、Chromeビルドを確認する。
- PR作成によるClaude Code自動レビューはない。必要なレビューは利用可能な
  `subagent-consultation` スキルで依頼し、criticalな指摘を修正してpushする。
  スキルが利用できない場合は、その旨を明示して利用可能なレビュー方法を選ぶ。

### GitHub操作

PR作成・マージには `gh` を使う。GitHub connectorはpush後でも
`Resource not accessible by integration` で失敗することがある。
Codex sandboxでDNS・認証エラーが出た場合は、認証不良と判断する前に、
実際に必要なAPIコマンドをネットワーク権限昇格付きで再試行する。
権限エラーが続く場合は `gh api user` でアカウントを確認する。
保存済みの適切なアカウントを使う場合も、他の作業の既定アカウントを変更しない。

commit/push後のPR作成例。本文はテンプレートに沿って `/private/tmp` のMarkdownファイルに書く。

```bash
gh pr create --repo motoso/uni --base main --head <branch> --title "<title>" --body-file /private/tmp/<body>.md
gh pr view <number> --repo motoso/uni --json number,state,mergeable,isDraft,headRefOid,url
gh pr checks <number> --repo motoso/uni
```

マージが依頼の範囲に含まれる場合は、最新のheadのCI通過後に次を使う。
既知の失敗を無視できるのは、ユーザーが明示した場合だけ。

```bash
gh pr merge <number> --repo motoso/uni --merge --delete-branch
```

## リリース

ChromeとFirefoxの両方を対象にする。`package.json`、`package-lock.json`、
`wxt.config.ts` のバージョンを揃えてリリースPRを作成する。
マージが依頼の範囲に含まれる場合は、CI通過後に `main` にマージする。
`dist/` の生成済みmanifestを直接編集しない。

`npm run package:all` で両ブラウザのZIPを生成する。
GitHub Releaseの公開は両ストア向けのworkflowを起動するため、
依頼されたリリース範囲に含まれるときに行う。

- [Chrome公開workflow](../../../.github/workflows/publish-chrome.yml)
- [Firefox公開workflow](../../../.github/workflows/publish-firefox.yml)
- Chromeの認証情報更新・アップロード・審査状態の確認: [Chrome Web Storeリリース手順](../../../docs/chrome-web-store-release.md)
- ストア側の追加情報: [Cosenseの開発者向け情報](https://scrapbox.io/motoso-uni/開発者向けの情報)

## 完了時

PR操作後はURLと状態、実行した検証と未完了の確認を報告する。
リリースではChromeとFirefoxそれぞれの公開workflow・ストア側の状態を区別して報告する。
