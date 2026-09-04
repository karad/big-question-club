# D1 Migration Procedure

Run from the repository root. Wrangler applies unapplied migrations in numeric order.

## Local Environment

```sh
npm run db:migrate:local
```

Restart the development server and inspect administration.

## Public Environment

First inspect unapplied migrations and create a backup.

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 export big-question-club-auth --remote --output /tmp/big-question-club-auth-backup.sql
```

Confirm `0006_admin_operations.sql` is unapplied and backup succeeded, then apply:

```sh
npm run db:migrate:remote
```

Verify the ledger and new tables:

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT name FROM sqlite_schema WHERE name IN ('banned_users', 'audit_logs') ORDER BY name;"
```

Completion requires applied `0006_admin_operations.sql` and visible `audit_logs` and `banned_users`.

If listing migrations or backup fails, stop without applying.
