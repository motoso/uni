# Chrome Web Storeリリース手順

このドキュメントでは、Chrome Web Store用のOAuth認証情報を更新し、GitHub Actionsから拡張機能をアップロードする手順を説明します。

## 前提条件

- Chrome Web Storeの公開者アカウントへログインできる
- Google Cloud ConsoleでOAuthクライアントを作成できる
- `Web` Vaultの`uni`アイテムを1Password CLIから参照できる
- `gh`、`op`、`curl`、`jq`をローカルで実行できる

GitHub Actionsは、次の1Password参照から認証情報を読み込みます。

```text
op://Web/uni/CHROME_CLIENT_ID
op://Web/uni/CHROME_CLIENT_SECRET
op://Web/uni/CHROME_REFRESH_TOKEN
```

## OAuth認証情報を発行する

### 1. OAuthクライアントを作成する

Google Cloud Consoleの「APIとサービス」から「認証情報」を開き、OAuth 2.0クライアントを作成します。

- アプリケーションの種類: ウェブ アプリケーション
- 名前: `uni Chrome Web Store CI`
- 承認済みのリダイレクトURI: `https://developers.google.com/oauthplayground`

作成後、Client IDとClient Secretを控えます。

### 2. Refresh tokenを発行する

[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)を開き、次の操作を行います。

1. 右上の歯車アイコンを開く
2. `Use your own OAuth credentials`を有効にする
3. 作成したClient IDとClient Secretを入力する
4. 次のスコープを入力する

    ```text
    https://www.googleapis.com/auth/chromewebstore
    ```

5. `Authorize APIs`を実行する
6. Chrome Web Storeの公開者アカウントで許可する
7. `Exchange authorization code for tokens`を実行する
8. 表示されたRefresh tokenを控える

必ず対象の拡張機能を所有しているGoogleアカウントで許可してください。

## 1Passwordを更新する

新しいOAuthクライアントを作成した場合は、Client ID、Client Secret、Refresh tokenをまとめて更新します。

```bash
read -r "CLIENT_ID?Client ID: "
read -rs "CLIENT_SECRET?Client Secret: "
echo
read -rs "REFRESH_TOKEN?Refresh token: "
echo

op item edit "uni" --vault "Web" \
  "CHROME_CLIENT_ID=$CLIENT_ID" \
  "CHROME_CLIENT_SECRET=$CLIENT_SECRET" \
  "CHROME_REFRESH_TOKEN=$REFRESH_TOKEN"
```

## 1Passwordの値をローカルで検証する

GitHub Actionsを実行する前に、1Passwordに保存した3つの値を使ってアクセストークンを取得できることを確認します。次のコマンドは秘密値を表示せず、検証結果だけを出力します。

```bash
CLIENT_ID="$(op read 'op://Web/uni/CHROME_CLIENT_ID')" \
CLIENT_SECRET="$(op read 'op://Web/uni/CHROME_CLIENT_SECRET')" \
REFRESH_TOKEN="$(op read 'op://Web/uni/CHROME_REFRESH_TOKEN')" \
zsh -c '
curl -sS https://oauth2.googleapis.com/token \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode "refresh_token=$REFRESH_TOKEN" \
  --data-urlencode "grant_type=refresh_token" |
jq "{ok: has(\"access_token\"), error, error_description}"
'
```

成功時は次の結果になります。

```json
{
    "ok": true,
    "error": null,
    "error_description": null
}
```

`invalid_grant`が返る場合は、Refresh tokenが失効しているか、発行時と異なるClient IDまたはClient Secretを使用しています。3つの値を同じOAuthクライアントから再発行してください。

## GitHub Actionsを実行する

リリースに紐づく失敗ジョブを再実行する場合は、次のコマンドを使います。

```bash
gh run rerun RUN_ID --failed --repo motoso/uni
gh run watch RUN_ID --repo motoso/uni --exit-status
```

`Publish to Chrome Web Store`ステップが成功したことを確認します。

現行の`.github/workflows/publish-chrome.yml`は、Chrome Web StoreへZIPファイルをアップロードします。Actionの実行ログでは`action: upload`として動作します。CI成功後、Chrome Web Store Developer Dashboardで審査提出と公開状態を確認してください。

## 後片付け

シェル変数から認証情報を削除します。

```bash
unset CLIENT_ID CLIENT_SECRET REFRESH_TOKEN
```

Client SecretやRefresh tokenを、Issue、Pull Request、CIログへ貼り付けないでください。
