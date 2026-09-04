# Google OAuth・Cloudflare事前準備手順

## 目的

SPEC 002の実装に先立ち、Google OAuthとCloudflare D1の検証環境を準備する。この手順で作成するのはOAuthクライアント、テストユーザー、D1データベース、正規Originの決定までである。アプリケーション実装、認証SecretのCloudflare登録、実機検証は後続の実装タスクで行う。

> **重要**: `GOOGLE_CLIENT_SECRET`、`BETTER_AUTH_SECRET`、Cookie値、OAuthトークンをリポジトリ、Issue、チャット、スクリーンショット、検証記録へ貼り付けない。

## 完了条件

- [ ] Google CloudプロジェクトとOAuth同意画面を用意した。
- [ ] テスト用Googleアカウントを2つ登録した。
- [ ] Web application型OAuthクライアントを作成した。
- [ ] ローカル用リダイレクトURIを登録した。
- [ ] デプロイ先の正規Originを決めた、または後で追加する対象として記録した。
- [ ] Cloudflareの認証用D1データベースを作成し、`database_id`を安全に記録した。
- [ ] Cloudflare WorkersにSecretを設定できる権限を確認した。

## 1. Google Cloudプロジェクトを用意する

1. [Google Cloud Console](https://console.cloud.google.com/)で、Big Question Clubの検証用プロジェクトを作成するか、既存プロジェクトを選択する。
2. **Google Auth Platform**でOAuth同意画面を開く。
3. アプリ名、ユーザーサポートメール、デベロッパーの連絡先メールを入力する。
4. 一般公開前の検証ではAudienceをテスト向けにし、Externalを選択した場合はテストユーザーを利用する。
5. スコープはGoogleログインに必要な基本情報だけに留める。追加のGoogle API権限や制限付きスコープは要求しない。

参照: [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## 2. テストユーザーを2つ登録する

1. テスト専用のGoogleアカウントAとBを用意する。
2. OAuth同意画面の**Test users**へAとBを追加する。
3. AとBのメールアドレスは、この文書・リポジトリ・検証記録に書かない。Google Cloud Consoleまたは安全なパスワードマネージャーだけで管理する。

この2アカウントは、同一アカウントの連続確認、アカウント分離、ログアウト、アカウント切替の各検証に使用する。

## 3. OAuthクライアントを作成する

1. Google Auth Platformの**Clients**で、**Web application**型のOAuth clientを作成する。
2. 名前には検証目的が分かる英語名を設定する。例: `Big Question Club Local Validation`。
3. **Authorized redirect URIs**へ、次のローカルURIを追加する。

   ```text
   http://localhost:5173/api/auth/callback/google
   ```

   Viteの既定ポートは`5173`である。実装時に開発サーバーが別ポートで起動した場合は、実際のportを使ったURIを追加する。scheme、host、port、pathはすべて完全一致が必要である。

4. Cloudflareの正規デプロイURLが決まっている場合は、次も追加する。

   ```text
   https://<your-production-origin>/api/auth/callback/google
   ```

   例: `https://big-question-club.<account-subdomain>.workers.dev/api/auth/callback/google`

5. 作成後に表示されるClient IDとClient Secretを、チームの安全なSecret管理場所へ保存する。Client Secretをこのリポジトリへ保存しない。

参照: [Google OAuth redirect URI rules](https://developers.google.com/identity/protocols/oauth2/web-server#redirect-uri_validation)、[Better Auth Google OAuth](https://better-auth.com/docs/authentication/google)

## 4. Cloudflareの正規Originを決める

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)で、Big Question ClubのWorkersデプロイ先を確認する。
2. 最初の検証では既存の`workers.dev` URLを使ってよい。カスタムドメインを使う場合は、OAuthクライアントに登録する前にHTTPSで到達できる状態にする。
3. 使用する正規Originを、次の形式で安全なチームメモへ記録する。パス、クエリ、末尾の`/`は含めない。

   ```text
   https://<your-production-origin>
   ```

4. この値は実装時の`BETTER_AUTH_URL`と、Google OAuthの承認済みリダイレクトURIの先頭部分に使用する。

## 5. 認証用D1データベースを作成する

Cloudflareへのログイン済みのターミナルで、リポジトリのルートから次を実行する。

```sh
npx wrangler d1 create big-question-club-auth
```

表示される`database_id`を安全なチームメモへ記録する。`database_id`はSecretではないが、アプリ実装時に`wrangler.jsonc`のD1バインディングへ正確に反映するために必要である。

この段階では、SQL migrationの適用やテーブル作成はしない。実装タスクでBetter Authの認証スキーマを追加してから適用する。

参照: [Cloudflare D1 get started](https://developers.cloudflare.com/d1/get-started/)

## 6. Workersの権限を確認する

以下を確認する。

- Workersをデプロイできる。
- D1データベースを参照・バインドできる。
- Workers Secretを設定できる。

CLIを使用する場合は、次でログイン中のCloudflareアカウントを確認できる。

```sh
npx wrangler whoami
```

## 実装時まで保留する設定

次の設定は、実装で環境変数名とWorker設定を追加してから行う。

| 設定 | 設定する担当 | 設定する時点 |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Cloudflareアカウントの管理者 | 実装後、ローカル・デプロイ環境の設定時 |
| `GOOGLE_CLIENT_SECRET` | Cloudflareアカウントの管理者 | 実装後、Workers Secret設定時 |
| `BETTER_AUTH_SECRET` | Cloudflareアカウントの管理者 | 実装後、Workers Secret設定時 |
| D1バインディング | 実装担当者 | `wrangler.jsonc`へ`database_id`を反映する時 |

SecretをCloudflareへ設定するコマンドは、実装時にこちらから変数名ごとに案内する。値の入力はCloudflareアカウントの管理者が直接行う。

参照: [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## 実装開始前の共有事項

次の情報だけを共有すれば実装を開始できる。Secretの値は共有しない。

- 作成したD1データベース名と`database_id`
- 採用するCloudflareの正規Origin
- ローカルの`5173`用リダイレクトURIを登録済みかどうか
- デプロイ先のリダイレクトURIを登録済みか、未確定か
- テスト用Googleアカウントを2つ準備済みかどうか
