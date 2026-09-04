# Developer Manual

Run from the repository root. Requires Node.js 22.13 or later or 24 or later, and npm.

## Initial Setup

```sh
npm install
cp .dev.vars.example .dev.vars
```

Set `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAIL` in `.dev.vars`. Never commit secrets.

Register `http://localhost:5173/api/auth/callback/google` as a Google OAuth redirect URI.

## Start Development Mode

```sh
npm run dev
```

Open the displayed URL. Current `wrangler.jsonc` sets the D1 binding to `remote: true`, so the development server connects to remote D1. Confirm remote migrations are already applied.

## Build

```sh
npm run build
```

## Test

```sh
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run db:schema:check
```

## Deploy

Configure public-environment values on the Cloudflare Worker. `.dev.vars` and local environment variables are not uploaded by `npm run deploy`.

Each command below prompts for a value and stores it directly as a Secret on the target Worker.

```sh
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ADMIN_EMAIL
npm run db:migrate:remote
npm run deploy
```

The same configuration can be made in the target Worker's Variables and Secrets screen in Cloudflare Dashboard. If these five values already exist in Production, `wrangler secret put` is unnecessary; do not duplicate CLI and Dashboard configuration.

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAIL`

Set `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` as Secrets. The other three may be Variables or Secrets. Re-register only when values change. If Preview and Production are separate, verify Production.

Also register the public Origin's `/api/auth/callback/google` as a Google OAuth redirect URI. See the [D1 migration procedure](./migration-manual.md).
