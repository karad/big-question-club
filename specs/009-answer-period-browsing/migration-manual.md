# D1マイグレーション手順

リポジトリ直下で実行する。Wranglerは未適用のMigrationを番号順に適用する。

## ローカル環境

```sh
npm run db:migrate:local
```

開発サーバーを再起動し、管理画面を確認する。

## 公開環境

最初に、未適用Migrationとバックアップを確認する。

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 export big-question-club-auth --remote --output /tmp/big-question-club-auth-backup.sql
```

一覧で`0006_admin_operations.sql`が未適用であり、バックアップが成功したことを確認してから適用する。

```sh
npm run db:migrate:remote
```

適用後、台帳と追加Tableを確認する。

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT name FROM sqlite_schema WHERE name IN ('banned_users', 'audit_logs') ORDER BY name;"
```

`0006_admin_operations.sql`が適用済みで、`audit_logs`と`banned_users`が表示されれば完了。

Migration一覧の取得またはバックアップに失敗した場合は、適用を中止する。
