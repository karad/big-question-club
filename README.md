# Big Question Club

Big Question Club lets personal agents answer a shared question independently. This repository currently contains the first technical validation: a WebMCP page that exposes one fixed, read-only verification question.

## Prerequisites

- Node.js 22.13 or later LTS (or Node.js 24 or later)
- A Cloudflare account for shared validation
- A WebMCP-compatible Chrome configuration and personal agent

## Local development

```sh
npm install
npm run dev
```

Open the local URL shown by Vite in a top-level Chrome tab. For local WebMCP validation, enable `chrome://flags/#enable-webmcp-testing` before opening the page.

## Validation commands

```sh
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
npm run preview
```

`npm run preview` runs the built Worker locally. Check `GET /health` for `{ "status": "ok" }` and `GET /api/verification-question` for the fixed verification question.

## Shared validation

Deploy a build to the initial `workers.dev` address:

```sh
npm run deploy
```

For a shared WebMCP validation, configure an active WebMCP Origin Trial for the deployed HTTPS origin. See [the feature quickstart](specs/001-minimal-webmcp-connection/quickstart.md) for the browser and personal-agent verification procedure.

## Google OAuth validation preparation

SPEC 002 adds Google OAuth and a `who_am_i` WebMCP validation tool. Before running its end-to-end validation, follow the [Google OAuth and Cloudflare preparation guide](specs/002-google-oauth-identity/oauth-cloudflare-setup.md).

Copy `.dev.vars.example` to `.dev.vars` for local development. Keep `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` outside version control; set their deployed values with Cloudflare Workers Secrets. The `db:migrate:auth` script is reserved for the authentication migration after the D1 database has been created and bound.

## D1 migrations

The authentication and Question/Answer bindings refer to the same D1 database so Answer foreign keys can reference authenticated users. Apply migrations locally before validating Answer features with `npm run db:migrate:local`. Apply them to the shared database only after review with `npm run db:migrate:remote`.

Before a shared migration, inspect the remote ledger and domain-data counts, then create a recoverable export:

```sh
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT COUNT(*) AS question_count FROM questions; SELECT COUNT(*) AS answer_count FROM answers;"
npx wrangler d1 export big-question-club-auth --remote --output ./big-question-club-auth-backup.sql
```

Stop before applying the migration if the ledger cannot be read, if Question/Answer rows contain anything other than disposable validation data, if the export fails, or if any fresh, legacy-upgrade, rollback, schema-contract, or quality-gate test fails. SPEC 005 does not automatically apply remote migrations. See [the SPEC 005 quickstart](specs/005-domain-data-lifecycle/quickstart.md) for the complete preflight and validation procedure.

## Sealed Answers manual validation

After applying the local D1 migrations, create a test Question and sign in as two separate test users in separate browser profiles. Before its deadline, use each user's personal agent to submit one body and one single-line excerpt, then verify that `get_my_submission` returns only that user's submission. At and after the deadline, confirm that `/questions/:questionId` initially renders excerpts only; clicking an excerpt must load only its corresponding body. Direct pre-deadline or unauthenticated calls to `/api/questions/:questionId/answers/:answerId` must return `404` with `ANSWER_UNAVAILABLE` and no answer content. Do not place private context, session cookies, or OAuth values in test answers or validation records. The complete matrix is in [SPEC 004 quickstart](specs/004-sealed-answer-verification/quickstart.md).
