# Implementation Plan: Validating Google OAuth and WebMCP User Identification

**Branch**: `002-google-oauth-identity` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification in `specs/002-google-oauth-identity/spec.md`

## Summary

Perform a P0 validation that a Big Question Club user logged into the browser through Google OAuth can be identified as the same service-internal user in a same-origin WebMCP Tool Call.

Add Better Auth and authentication data in D1 to the existing Cloudflare Workers, Hono, and Vite stack. OAuth and Sessions remain within the application's canonical Origin. The WebMCP `who_am_i` Tool calls an identity verification API through a relative URL from the browser page. The API validates the received authentication Cookie on the server and returns only the service-internal user ID when authenticated. Google account information, OAuth tokens, Cookie values, and Secrets are never returned in screens, Tool responses, or records.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later for development, ES2022

**Primary Dependencies**: Cloudflare Workers, Hono 4, Vite 8, Better Auth (Google OAuth), Cloudflare D1, Vitest 4

**Storage**: Cloudflare D1. This SPEC stores only the User, Account, Session, and Verification authentication data managed by Better Auth.

**Testing**: Unit and Integration Tests with Vitest; manual E2E validation using a WebMCP-compatible Chrome environment and two test Google accounts

**Target Platform**: Cloudflare Workers and a WebMCP-compatible Chrome environment. OAuth callbacks are handled only on the canonical Origin over local HTTP or production HTTPS.

**Project Type**: Single web application including SSR

**Performance Goals**: The identity verification API and `who_am_i` Tool return a result within two seconds under ordinary development and validation network conditions when logged in.

**Constraints**: Restrict the identity verification API and Tool to the same Origin. Do not include `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, Cookie values, OAuth tokens, or email addresses in the repository, logs, screens, Tool responses, or validation records. Do not enable Session Cookie caching, so stale Sessions are not returned after sign-out, authentication expiration, or account switching.

**Scale/Scope**: P0 authentication feasibility validation covering at least two test Google accounts, one identity verification API, one `who_am_i` Tool, a login-state display, and a Go/No-Go record. Question and Answer functionality is out of scope.

## Constitution Check

*Gate: Must pass before Phase 0 research and be rechecked after Phase 1 design.*

`constitution.md` is an undecided template and defines no applicable concrete principles. Use the following gates from the project's `AGENTS.md` instead:

- Create tests for unit-testable authentication-result conversion, input validation, and Session branches.
- Cover authenticated and unauthenticated HTTP flows and the WebMCP identity verification flow with Integration Tests.
- Do not store Secrets, tokens, or email addresses in source code, test fixtures, logs, Tool responses, or documentation.
- Do not proceed to P1 implementation such as Answer submission until P0 receives a Go decision.

**Decision (Before Phase 0)**: Pass. Persistence is required to verify immediate authentication invalidation and account switching, and exposed personal information is limited to the service-internal user ID.

## Project Structure

### Documentation for This Feature

```text
specs/002-google-oauth-identity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── who-am-i.md
└── tasks.md
```

### Source Code at the Repository Root

```text
src/
├── app.tsx                         # Hono routes and SSR pages
├── auth/
│   ├── auth.ts                     # Better Auth configuration and authentication handler
│   ├── config.ts                   # Environment configuration validation
│   └── session.ts                  # Safe conversion of request authentication results
├── domain/
│   └── identity.ts                 # Public identity result and error contract
├── routes/
│   ├── auth.ts                     # Authentication status and identity verification API
│   └── health.ts
├── webmcp/
│   └── register-who-am-i-tool.ts   # Tool registration and same-origin fetch
└── client.ts                       # Login-state display and Tool registration

tests/
├── integration/
│   ├── auth-route.test.ts
│   └── who-am-i-api.test.ts
└── unit/
    ├── auth-config.test.ts
    ├── identity.test.ts
    └── register-who-am-i-tool.test.ts
```

**Structure Decision**: Retain the existing single-Worker application. Placing authentication routes, the identity verification API, and the WebMCP Tool on the same canonical Origin safely uses the browser's ordinary Session Cookie without depending on CORS or third-party Cookies.

## Complexity Tracking

Not applicable.

## Constitution Check After Phase 1

**Decision**: Pass. `data-model.md` defines only the minimum authentication entities, while `contracts/who-am-i.md` exposes only the service-internal user ID. `quickstart.md` never handles Secret values and prohibits recording Cookies or tokens during real-device verification. Required behavior is verified at the Unit, Integration, and manual E2E layers.
