# 開発者向けマニュアル

リポジトリ直下で実行する。Node.js 22.13以上または24以上とnpmが必要。

## 初期設定

```sh
npm install
cp .dev.vars.example .dev.vars
```

`.dev.vars`へ`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`ADMIN_EMAIL`を設定する。Secretをコミットしない。

Google OAuthには`http://localhost:5173/api/auth/callback/google`をリダイレクトURIとして登録する。

## 開発モードで起動

```sh
npm run dev
```

表示されたURLをブラウザーで開く。現在の`wrangler.jsonc`はD1 Bindingが`remote: true`のため、開発サーバーからリモートD1へ接続する。事前にリモートMigrationが適用済みであることを確認する。

## ビルド

```sh
npm run build
```

## テスト

```sh
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run db:schema:check
```

## デプロイ

公開環境の値はCloudflare Worker側へ設定する。`.dev.vars`やローカルの環境変数は、`npm run deploy`ではアップロードされない。

次の各コマンドを実行すると値の入力を求められ、入力した値が対象WorkerのSecretとしてCloudflareへ直接保存される。

```sh
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ADMIN_EMAIL
npm run db:migrate:remote
npm run deploy
```

同じ設定はCloudflare Dashboardの対象WorkerにあるVariables and Secrets画面から行ってもよい。次の5項目がProduction環境へ設定済みなら、`wrangler secret put`は不要である。CLIとDashboardの両方で重複して設定する必要はない。

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAIL`

`BETTER_AUTH_SECRET`と`GOOGLE_CLIENT_SECRET`はSecretとして設定する。他の3項目は通常のVariableまたはSecretのどちらでもよい。値を変更しない限り、デプロイのたびに再登録する必要はない。PreviewとProductionが分かれている場合は、Production側の設定を確認する。

Google OAuthには公開Originの`/api/auth/callback/google`もリダイレクトURIとして登録する。Migrationの詳細は[D1マイグレーション手順](./migration-manual_ja.md)を参照する。
