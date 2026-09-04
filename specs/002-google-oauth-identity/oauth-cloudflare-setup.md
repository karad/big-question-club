# Google OAuth and Cloudflare Preparation Guide

## Purpose

Prepare the Google OAuth and Cloudflare D1 verification environment before implementing SPEC 002. This procedure covers creating an OAuth client, test users, and a D1 database, and deciding the canonical Origin. Application implementation, registering authentication Secrets with Cloudflare, and real-device verification are performed in subsequent implementation tasks.

> **Important**: Do not paste `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, Cookie values, or OAuth tokens into the repository, Issues, chats, screenshots, or validation records.

## Completion Criteria

- [ ] A Google Cloud project and OAuth consent screen have been prepared.
- [ ] Two test Google accounts have been registered.
- [ ] A Web application OAuth client has been created.
- [ ] The local redirect URI has been registered.
- [ ] The deployment's canonical Origin has been decided or recorded for later addition.
- [ ] A Cloudflare D1 authentication database has been created and its `database_id` recorded securely.
- [ ] Permission to configure Secrets in Cloudflare Workers has been confirmed.

## 1. Prepare a Google Cloud Project

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a validation project for Big Question Club or select an existing project.
2. Open the OAuth consent screen in **Google Auth Platform**.
3. Enter the application name, user-support email, and developer contact email.
4. For validation before public release, set the Audience for testing. If External is selected, use test users.
5. Limit Scopes to the basic information required for Google sign-in. Do not request additional Google API permissions or restricted Scopes.

Reference: [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## 2. Register Two Test Users

1. Prepare dedicated test Google accounts A and B.
2. Add A and B under **Test users** on the OAuth consent screen.
3. Do not write the email addresses of A or B in this document, the repository, or validation records. Manage them only in Google Cloud Console or a secure password manager.

Use these two accounts to verify consecutive checks for the same account, account isolation, sign-out, and account switching.

## 3. Create an OAuth Client

1. Under **Clients** in Google Auth Platform, create a **Web application** OAuth client.
2. Give it an English name that describes its validation purpose, such as `Big Question Club Local Validation`.
3. Add the following local URI to **Authorized redirect URIs**.

   ```text
   http://localhost:5173/api/auth/callback/google
   ```

   Vite's default port is `5173`. If the development server starts on another port during implementation, add a URI using the actual port. The scheme, host, port, and path must all match exactly.

4. If the canonical Cloudflare deployment URL is known, also add the following:

   ```text
   https://<your-production-origin>/api/auth/callback/google
   ```

   Example: `https://big-question-club.<account-subdomain>.workers.dev/api/auth/callback/google`

5. Store the displayed Client ID and Client Secret in the team's secure Secret-management location. Do not store the Client Secret in this repository.

References: [Google OAuth redirect URI rules](https://developers.google.com/identity/protocols/oauth2/web-server#redirect-uri_validation), [Better Auth Google OAuth](https://better-auth.com/docs/authentication/google)

## 4. Decide the Canonical Cloudflare Origin

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), check the Workers deployment destination for Big Question Club.
2. An existing `workers.dev` URL may be used for the initial validation. If using a custom domain, make it reachable over HTTPS before registering it with the OAuth client.
3. Record the canonical Origin in a secure team note using the following format. Do not include a path, query, or trailing `/`.

   ```text
   https://<your-production-origin>
   ```

4. During implementation, use this value for `BETTER_AUTH_URL` and as the prefix of the Google OAuth authorized redirect URI.

## 5. Create the Authentication D1 Database

From the repository root in a terminal logged in to Cloudflare, run:

```sh
npx wrangler d1 create big-question-club-auth
```

Record the displayed `database_id` in a secure team note. The `database_id` is not a Secret, but it must be copied accurately into the D1 binding in `wrangler.jsonc` during application implementation.

Do not apply SQL migrations or create tables at this stage. Add the Better Auth authentication Schema in the implementation tasks before applying it.

Reference: [Cloudflare D1 get started](https://developers.cloudflare.com/d1/get-started/)

## 6. Confirm Workers Permissions

Confirm that you can:

- Deploy Workers.
- Access and bind the D1 database.
- Configure Workers Secrets.

When using the CLI, confirm the currently signed-in Cloudflare account with:

```sh
npx wrangler whoami
```

## Configuration Deferred Until Implementation

Configure the following after the implementation adds the environment-variable names and Worker settings.

| Setting | Responsible Party | When to Configure |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Cloudflare account administrator | After implementation, when configuring local and deployment environments |
| `GOOGLE_CLIENT_SECRET` | Cloudflare account administrator | After implementation, when configuring Workers Secrets |
| `BETTER_AUTH_SECRET` | Cloudflare account administrator | After implementation, when configuring Workers Secrets |
| D1 binding | Developer | When adding the `database_id` to `wrangler.jsonc` |

During implementation, commands for configuring Secrets in Cloudflare will be provided for each variable name. The Cloudflare account administrator enters the values directly.

Reference: [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Information to Share Before Implementation Starts

Only the following information is needed to begin implementation. Do not share Secret values.

- The created D1 database name and `database_id`
- The selected canonical Cloudflare Origin
- Whether the local redirect URI for port `5173` has been registered
- Whether the deployment redirect URI has been registered or is not yet decided
- Whether two test Google accounts are ready
