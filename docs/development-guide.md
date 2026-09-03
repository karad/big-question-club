# Development Guide

This guide contains the detailed environment, validation, and deployment procedures intentionally omitted from the project README.

## Environment configuration

Copy `.dev.vars.example` to `.dev.vars` for local development. Keep `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` outside version control; set their deployed values with Cloudflare Workers Secrets. The `db:migrate:auth` script is reserved for the authentication migration after the D1 database has been created and bound.

Set `ADMIN_EMAIL` to the one Google account allowed to use `/club-operations`. The comparison is case-insensitive after trimming. Leave no placeholder value in a deployed environment: a missing or invalid value keeps all administration routes unavailable. Do not store the administrator's password or OAuth tokens in this setting.

Before running the Google OAuth and `who_am_i` end-to-end validation, follow the [Google OAuth and Cloudflare preparation guide](../specs/002-google-oauth-identity/oauth-cloudflare-setup.md).

For a compact reference covering setup, build, test, and deployment commands, see the [SPEC 009 developer manual](../specs/009-answer-period-browsing/developer-manual.md).

## Local database migrations

The authentication and Question/Answer bindings refer to the same D1 database so Answer foreign keys can reference authenticated users. Apply migrations locally before validating Answer features:

```sh
npm run db:migrate:local
```

## Automated validation

Run the full quality gate:

```sh
npm run typecheck
npm run lint
npm run format
npm run test
npm run test:d1
npm run build
```

`npm run preview` runs the built Worker locally. Check `GET /health` for `{ "status": "ok" }` and `GET /api/verification-question` for the fixed verification question.

## Manual validation

### Shared WebMCP validation

Configure an active WebMCP Origin Trial for the deployed HTTPS origin. Follow the [SPEC 001 quickstart](../specs/001-minimal-webmcp-connection/quickstart.md) for the browser and personal-agent verification procedure.

### Sealed Answers

After applying the local D1 migrations, create a test Question and sign in as two separate test users in separate browser profiles. Before its deadline, use each user's personal agent to submit one body and one single-line excerpt, then verify that `get_my_submission` returns only that user's submission.

At and after the deadline, confirm that `/questions/:questionId` initially renders excerpts only and that clicking an excerpt loads only its corresponding body. Direct pre-deadline or unauthenticated calls to `/api/questions/:questionId/answers/:answerId` must return `404` with `ANSWER_UNAVAILABLE` and no answer content. Do not place private context, session cookies, OAuth values, or secrets in test Questions, Answers, or validation records.

The complete test matrices are available in these guides:

- [Sealed Answer verification](../specs/004-sealed-answer-verification/quickstart.md)
- [Question publishing](../specs/006-question-publishing/quickstart.md)
- [WebMCP answer workflow](../specs/007-webmcp-mvp-tools/quickstart.md)
- [Sealed Answer access](../specs/008-sealed-answer-access/quickstart.md)

## Deployment

Before a shared migration, inspect the remote migration ledger and domain-data counts, then create a recoverable export:

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT COUNT(*) AS question_count FROM questions; SELECT COUNT(*) AS answer_count FROM answers;"
npx wrangler d1 export big-question-club-auth --remote --output ./big-question-club-auth-backup.sql
```

Stop before applying the migration if the ledger cannot be read, if Question/Answer rows contain anything other than disposable validation data, if the export fails, or if any fresh, legacy-upgrade, rollback, schema-contract, or quality-gate test fails. Remote migrations are never applied automatically.

See the [SPEC 005 quickstart](../specs/005-domain-data-lifecycle/quickstart.md) for the complete preflight and validation procedure and the [D1 migration manual](../specs/009-answer-period-browsing/migration-manual.md) for the compact administration migration procedure.

After review, migrate and deploy:

```sh
npm run db:migrate:remote
npm run deploy
```

