# Chrome Web Storeリリース手順

このドキュメントでは、Chrome Web Store API v2とサービスアカウントを使い、GitHub Actionsから拡張機能をアップロードして審査へ提出する手順を説明します。

## 前提条件

- Chrome Web Storeの公開者アカウントへログインできる
- Google Cloud Consoleでサービスアカウントを作成できる
- `Web` Vaultの`uni`アイテムを1Password CLIから参照できる
- `gh`と`op`をローカルで実行できる

GitHub Actionsは、次の1Password参照から認証情報を読み込みます。

```text
op://Web/uni/CHROME_PUBLISHER_ID
op://Web/uni/CHROME_SERVICE_ACCOUNT_JSON
```

## サービスアカウントを設定する

1. Google Cloud ConsoleでChrome Web Store APIを有効にします。
2. 専用のサービスアカウントを作成します。この時点ではGoogle Cloud IAMロールの追加は不要です。
3. Chrome Web Store Developer Dashboardの「Account」で、サービスアカウントのメールアドレスをpublisherへ追加します。publisherに追加できるサービスアカウントは1つです。
4. サービスアカウントのJSON鍵を作成します。
5. Developer Dashboardからpublisher IDを確認します。

詳細はChrome公式の[サービスアカウント設定手順](https://developer.chrome.com/docs/webstore/service-accounts)を参照してください。

## 1Passwordを更新する

publisher IDとJSON鍵の内容全体を、それぞれ1Passwordの`uni`アイテムへ保存します。

JSON鍵は改行を含む値のまま保存してください。CLIから更新する場合、シェル引数やログへ鍵を露出させないように`op item edit`の対話編集を使います。移行完了後、旧`CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN`フィールドは削除できます。

## GitHub Actionsを実行する

### 認証と権限だけを確認する

GitHub Actionsの`Publish Chrome Extension`を手動実行し、`mode`で`validate`を選択します。`validate`は既定値です。

このモードではサービスアカウント認証と対象拡張機能へのアクセスだけを確認します。ZIPの作成、アップロード、審査提出は実行しないため、公開済みバージョンと同じバージョンでも安全に実行できます。

`Preflight Chrome Web Store access`が成功し、以降の公開ステップがskipされていることを確認してください。

### 新しいバージョンを公開する

通常は、バージョンを更新したGitHub Releaseをpublishすると公開処理が自動実行されます。手動で公開する必要がある場合に限り、`mode`で`publish`を明示的に選択してください。同じバージョンを再アップロードすることはできません。

リリースに紐づく失敗ジョブを再実行する場合は、次のコマンドを使います。

```bash
gh run rerun RUN_ID --failed --repo motoso/uni
gh run watch RUN_ID --repo motoso/uni --exit-status
```

次のステップが成功したことを確認します。

- `Preflight Chrome Web Store access`: 認証、publisher ID、拡張機能へのアクセスを検証
- `Upload to Chrome Web Store`: API v2でZIPファイルをアップロード
- `Submit for review and publication`: 審査へ提出し、承認後の公開を予約
- `Report Chrome Web Store status`: 提出直後の状態をログへ出力

APIの`publish`は審査通過後の公開までを要求します。CI成功は審査通過や公開完了を意味しないため、Developer Dashboardでも最終状態を確認してください。API v2の各操作はChrome公式の[API利用手順](https://developer.chrome.com/docs/webstore/using-api)を参照してください。

サービスアカウントのJSON鍵を、Issue、Pull Request、CIログへ貼り付けないでください。鍵が漏洩した場合はGoogle Cloud Consoleで直ちに無効化し、新しい鍵へ交換してください。
