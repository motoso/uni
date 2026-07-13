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

### 1. Google Cloudプロジェクトを選ぶ

1. [Google Cloud Console](https://console.cloud.google.com/)を開きます。
2. 画面上部のプロジェクト選択から、uniの公開に使うプロジェクトを選びます。適切なプロジェクトがない場合は、`uni-chrome-web-store`などの名前で作成します。

従来のOAuthクライアントと同じプロジェクトである必要はありません。

### 2. Chrome Web Store APIを有効にする

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」を開きます。
2. `Chrome Web Store API`を検索します。
3. 対象がChrome Web Store APIであることを確認し、「有効にする」を選択します。

### 3. サービスアカウントを作成する

1. Google Cloud Consoleの[サービスアカウント一覧](https://console.cloud.google.com/iam-admin/serviceaccounts)を開きます。
2. 「サービスアカウントを作成」を選択します。
3. 次のように入力します。

    ```text
    サービスアカウント名: uni-chrome-web-store
    説明: Publishes uni from GitHub Actions
    ```

4. 「作成して続行」を選択します。
5. Google Cloud IAMロールは追加せず、「続行」または「完了」を選択します。

作成後、次の形式のサービスアカウントメールアドレスを控えます。このメールアドレス自体は秘密情報ではありません。

```text
uni-chrome-web-store@PROJECT_ID.iam.gserviceaccount.com
```

Chrome Web Storeに対する権限はGoogle Cloud IAMではなく、次の手順でDeveloper Dashboardから付与します。

### 4. Chrome Web Storeのpublisherへ登録する

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)を開き、uniを所有している公開者アカウントでログインします。
2. 複数のpublisherに所属している場合は、uniを所有するpublisherへ切り替えます。
3. 「Account」を開きます。
4. サービスアカウント設定欄へ、前の手順で控えたメールアドレスを入力して保存します。

publisherへ登録できるサービスアカウントは1つです。すでに別のサービスアカウントが登録されている場合は、置き換える前に他の公開処理で使われていないことを確認してください。

### 5. Publisher IDを確認する

Developer Dashboardの「Publisher」→「Settings」でPublisher IDを確認して控えます。Publisher IDと拡張機能IDは別の値です。

uniの拡張機能IDは次の値です。

```text
jdihchpmnchcjigdmecmjieeanhcfbpm
```

### 6. JSON鍵を作成する

1. Google Cloud Consoleのサービスアカウント一覧へ戻ります。
2. 作成した`uni-chrome-web-store`を選択します。
3. 「キー」タブを開きます。
4. 「鍵を追加」→「新しい鍵を作成」を選択します。
5. キーのタイプとして「JSON」を選択し、「作成」を選択します。

ダウンロードされたJSONファイルは、サービスアカウントとして認証できる秘密鍵です。Gitへ追加したり、Issue、Pull Request、チャット、CIログへ内容を貼り付けたりしないでください。

詳細はChrome公式の[サービスアカウント設定手順](https://developer.chrome.com/docs/webstore/service-accounts)を参照してください。

## 1Passwordを更新する

1Passwordアプリで`Web` Vaultの`uni`アイテムを開き、次の2つのTextフィールドを追加します。

| フィールド名                  | 値                                        |
| ----------------------------- | ----------------------------------------- |
| `CHROME_PUBLISHER_ID`         | Developer Dashboardで確認したPublisher ID |
| `CHROME_SERVICE_ACCOUNT_JSON` | ダウンロードしたJSONファイルの内容全体    |

JSON鍵は先頭の`{`から最後の`}`まで、改行を含む値のまま保存してください。シェル引数やログへ鍵を露出させないため、CLIより1Passwordアプリでの編集を推奨します。

保存後、ダウンロードフォルダなどに残ったJSONファイルを安全に削除します。JSON鍵を再表示する必要がある運用は避け、漏洩した可能性がある場合はGoogle Cloud Consoleで直ちに無効化して新しい鍵へ交換してください。

### 1Passwordの設定を確認する

次のコマンドは秘密値を表示せず、2つの参照が存在することとJSON鍵の基本構造を確認します。

```bash
zsh -c '
set -euo pipefail
publisher_id="$(op read "op://Web/uni/CHROME_PUBLISHER_ID")"
service_account_json="$(op read "op://Web/uni/CHROME_SERVICE_ACCOUNT_JSON")"

[[ -n "$publisher_id" ]]
printf "%s" "$service_account_json" | jq -e '\''
  .type == "service_account" and
  (.client_email | type == "string" and length > 0) and
  (.private_key | type == "string" and startswith("-----BEGIN PRIVATE KEY-----")) and
  (.token_uri == "https://oauth2.googleapis.com/token")
'\'' >/dev/null

echo "Chrome Web Store service account configuration: valid"
'
```

成功時は次の1行だけが表示されます。

```text
Chrome Web Store service account configuration: valid
```

API v2移行後の本番公開が成功したら、不要になった旧`CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN`フィールドを削除できます。

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
