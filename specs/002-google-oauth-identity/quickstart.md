# Validation Guide: Google OAuth and WebMCP User Identification

## Purpose

This guide describes how to verify success criteria SC-001 through SC-005 from the [specification](./spec.md) in a real browser and record a Go/No-Go decision. See the [identity verification contract](./contracts/who-am-i.md) for API and Tool response formats. See the [Google OAuth and Cloudflare preparation guide](./oauth-cloudflare-setup.md) for Google Cloud and Cloudflare preparation before implementation.

## Prerequisites

- Node.js 22.13 or later and npm are available.
- A Cloudflare account and verification environment capable of storing authentication data in D1 are available.
- An OAuth consent screen and a Web application OAuth client can be prepared in Google Cloud Console.
- Two different Google accounts dedicated to testing are available.
- A WebMCP-compatible Chrome environment and a Personal Agent are available.
- Actual Secret values are not left in terminal history, the repository, screenshots, or validation records.

## Authentication Configuration

1. Decide the canonical Origins for local use and deployment. Use HTTPS for the deployment.
2. In Google Cloud Console, register `/api/auth/callback/google` for each Origin as an authorized redirect URI. The scheme, host, port, and path must match exactly.
3. Set `BETTER_AUTH_URL` to the canonical Origin without a path.
4. Configure `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` as environment settings or Cloudflare Secrets. Do not add their values to documentation or commits.
5. Apply the authentication D1 data to the verification environment.

## Startup and Preliminary Checks

1. After installing dependencies, start the local development server with `npm run dev`. For shared verification, use `npm run build` and `npm run deploy`.
2. Open the canonical Origin in a top-level Chrome tab.
3. Enable Chrome's WebMCP verification setting and confirm that the page registers `who_am_i`.
4. While signed out, confirm that both the browser identity display and `GET /api/who-am-i` return `AUTHENTICATION_REQUIRED`.

## Go/No-Go Validation Matrix

| Case | Action | Expected Result | Decision |
| --- | --- | --- | --- |
| Same account | Sign in with Account A and check ten times each from the browser and Tool | Returns the same `userId` every time | No-Go if any result differs or is unauthenticated |
| Account isolation | Check the Tool five times each with Accounts A and B | Constant within each account, with different `userId` values for A and B | No-Go if values match or are mixed even once |
| Unauthenticated or expired | Check after sign-out, authorization denial, and expiration | Every result is `AUTHENTICATION_REQUIRED` without `userId` | No-Go if `userId` is returned even once |
| Account switching | Sign out of A, sign in with B, and check | Returns only B's `userId` | No-Go if A's `userId` or an unauthenticated result is returned |

For each case, record the execution time, page Origin, API URL, HTTP status, browser `userId`, Tool `userId`, whether the result matches expectations, and the decision. Do not record Cookie values, Authorization values, OAuth tokens, email addresses, or Secrets.

## Automated Checks

After implementation, run:

```sh
npm test
npm run typecheck
npm run lint
npm run format
```

Decide Go only when every command succeeds and every case in the Go/No-Go matrix meets its expected result.
