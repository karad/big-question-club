# Tasks: Validating Google OAuth and WebMCP User Identification

**Input**: Design artifacts in `specs/002-google-oauth-identity/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/who-am-i.md`, `quickstart.md`

**Testing**: Following the project testing policy, create Unit Tests for pure authentication results, environment configuration, and WebMCP Tool branches, and Integration Tests for HTTP flows. Verify actual Google OAuth and browser Cookie propagation with manual E2E testing.

**Organization**: Tasks are organized so each user story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches files different from other unfinished tasks.
- **[Story]**: The corresponding user story (`US1`, `US2`, or `US3`).
- Every task includes the exact file path to change.

## Phase 1: Setup (Shared Foundation)

**Purpose**: Prepare dependencies, Cloudflare configuration, and Secret-management foundations required for authentication validation.

- [X] T001 Define Better Auth and D1 dependencies and execution scripts in `package.json`, then update `package-lock.json`
- [X] T002 [P] Add the D1 binding and Workers compatibility settings required by Better Auth to `wrangler.jsonc`
- [X] T003 [P] Add the names and descriptions of `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`, without Secrets, to `.dev.vars.example`
- [X] T004 [P] Exclude `.dev.vars`, local authentication configuration, and generated D1 development data in `.gitignore`
- [X] T005 Add authentication-validation prerequisites, the policy against committing Secrets, and a link to the SPEC 002 validation guide to `README.md`

---

## Phase 2: Foundation (Prerequisite Blocking All User Stories)

**Purpose**: Implement authentication data, environment configuration, Session validation, and the shared error contract.

**⚠️ Important**: Do not begin implementing user stories until this Phase is complete.

- [X] T006 Generate the Better Auth authentication Schema and add D1 definitions for User, Account, Session, and Verification to `migrations/0001_better_auth.sql`
- [X] T007 [P] Add Workers types for the D1 binding and authentication environment variables to `src/types/env.d.ts`
- [X] T008 [P] Add tests to `tests/unit/auth-config.test.ts` for missing values, localhost and HTTPS canonical Origins, and configuration validation that does not output Secret values
- [X] T009 [P] Add tests to `tests/unit/identity.test.ts` confirming that public results for authenticated, unauthenticated, and failure states contain nothing other than the User ID
- [X] T010 Implement reading authentication environment variables, canonical-Origin validation, and safe conversion of configuration errors in `src/auth/config.ts`
- [X] T011 Implement shared success, unauthenticated, and temporary-failure responses and input validation for the `who_am_i` API and Tool in `src/domain/identity.ts`
- [X] T012 Implement a Better Auth instance configured with Google OAuth, persistent D1 Sessions, disabled Cookie caching, and account selection in `src/auth/auth.ts`
- [X] T013 Implement a function in `src/auth/session.ts` that extracts only the publicly exposable User ID from the request's current Session
- [X] T014 Implement the Better Auth handler and a shared route function that safely retrieves login state in `src/routes/auth.ts`
- [X] T015 Register the `/api/auth/*` authentication handler before the catch-all route in `src/app.tsx` and inject authentication dependencies into the Worker environment

**Checkpoint**: The authentication Schema can be applied to D1, and the shared environment-configuration and Session-validation foundation is testable.

---

## Phase 3: User Story 1 — Use WebMCP as the Logged-In User (Priority: P1) 🎯 MVP

**Goal**: Make a browser signed in through Google OAuth and the `who_am_i` Tool return the same service-internal User ID.

**Independent Test**: Sign in with a test account and confirm that the browser identity display, `GET /api/who-am-i`, and WebMCP `who_am_i` all return the same User ID.

### User Story 1 Tests

- [X] T016 [P] [US1] Add an Integration Test to `tests/integration/who-am-i-api.test.ts` confirming that `GET /api/who-am-i` returns `200` and only the User ID for a valid Session
- [X] T017 [P] [US1] Add Tool Unit Tests for empty input, same-origin fetch, the success result, and AbortSignal to `tests/unit/register-who-am-i-tool.test.ts`
- [X] T018 [P] [US1] Add an Integration Test to `tests/integration/auth-page.test.ts` confirming that the authenticated page displays only the User ID and contains no email address or Cookie value

### User Story 1 Implementation

- [X] T019 [P] [US1] Implement a route in `src/routes/who-am-i.ts` that validates the current Session and serves `GET /api/who-am-i`
- [X] T020 [P] [US1] Implement a read-only, empty-input `who_am_i` Tool and fetch to the relative URL `/api/who-am-i` in `src/webmcp/register-who-am-i-tool.ts`
- [X] T021 [US1] Register `GET /api/who-am-i` and an SSR page showing authenticated state in `src/app.tsx`
- [X] T022 [US1] Implement `who_am_i` Tool registration and an English WebMCP-support status display in `src/client.ts`
- [X] T023 [US1] Add types used by the `who_am_i` Tool to `src/types/webmcp.d.ts` while preserving compatibility with existing Question Tool types
- [X] T024 [US1] Pass `tests/integration/who-am-i-api.test.ts` and `tests/unit/register-who-am-i-tool.test.ts`, and confirm that the API and Tool success contract matches `contracts/who-am-i.md`
- [X] T025 [US1] Perform the ten same-account checks in `specs/002-google-oauth-identity/quickstart.md` and record the results in `specs/002-google-oauth-identity/validation-record.md`

**Checkpoint**: US1 works independently, and User ID agreement between the logged-in browser and WebMCP Tool can be verified.

---

## Phase 4: User Story 2 — Identify Accounts Without Confusing Them (Priority: P2)

**Goal**: Prevent incorrect or mixed User IDs for unauthenticated states, different Google accounts, and account switching.

**Independent Test**: Simulate Sessions for Accounts A and B, an unauthenticated state, and an expired Session in HTTP/WebMCP checks, confirming that only the current authenticated User ID is returned.

### User Story 2 Tests

- [X] T026 [P] [US2] Add tests to `tests/integration/who-am-i-api.test.ts` confirming that unauthenticated, expired, and corrupted Cookies return `401 AUTHENTICATION_REQUIRED` without a User ID
- [X] T027 [P] [US2] Add conversion tests to `tests/unit/identity.test.ts` that do not expose a different User ID, past Session, or anonymous substitute identifier
- [X] T028 [P] [US2] Add tests to `tests/unit/register-who-am-i-tool.test.ts` converting `401` and `500` into safe Tool errors

### User Story 2 Implementation

- [X] T029 [US2] Unify conversion of unauthenticated, expired, and corrupted authentication information to `AUTHENTICATION_REQUIRED` in `src/auth/session.ts` and `src/routes/who-am-i.ts`
- [X] T030 [US2] Convert unauthenticated and temporary failures to contract-compliant Tool results in `src/webmcp/register-who-am-i-tool.ts`, without exposing identifying information in exceptions or response bodies
- [X] T031 [US2] Perform the account-isolation, unauthenticated/expired, and account-switching checks in `specs/002-google-oauth-identity/quickstart.md`, then record the results in `specs/002-google-oauth-identity/validation-record.md`

**Checkpoint**: Without breaking the US1 success flow, invalid authentication states and different accounts never produce an incorrect User ID.

---

## Phase 5: User Story 3 — Make a Go/No-Go Decision from Validation Results (Priority: P3)

**Goal**: Determine from reproducible records whether WebMCP and Google OAuth user identification passed P0.

**Independent Test**: Record expected results, observed results, and decisions for all four cases in a format containing no Secrets, and confirm that any failure produces a No-Go conclusion.

### User Story 3 Tests

- [X] T032 [P] [US3] Add a test to `tests/unit/identity.test.ts` confirming that validation records can output only the User ID, status, and safe error code

### User Story 3 Implementation

- [X] T033 [US3] Create a Secret-free template in `specs/002-google-oauth-identity/validation-record.md` for four cases, execution time, Origin, HTTP status, ID agreement, and Go/No-Go
- [X] T034 [US3] Align the decision rule in `specs/002-google-oauth-identity/quickstart.md` and `specs/002-google-oauth-identity/validation-record.md` so any signed-in mismatch or unauthenticated result produces No-Go
- [X] T035 [US3] Record all automated-test and manual-E2E results in `specs/002-google-oauth-identity/validation-record.md` and finalize Go/No-Go against SC-001 through SC-005

**Checkpoint**: The product owner can independently confirm the P0 conclusion using only the validation record.

---

## Phase 6: Polish and Cross-Cutting Checks

**Purpose**: Align implementation, documentation, and quality gates, and establish readiness for subsequent SPECs.

- [X] T036 [P] Add Integration Tests to `tests/integration/auth-route.test.ts` confirming that Google OAuth initiation and callback failures do not return Secrets, tokens, or email addresses
- [X] T037 Add safe HTTP responses for authentication errors and English authentication-status UI text to `src/app.tsx` and `src/routes/auth.ts`
- [X] T038 [P] Cross-check and update environment-variable names, redirect URIs, and manual validation steps between `README.md` and `specs/002-google-oauth-identity/quickstart.md`
- [X] T039 Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format` through the quality commands in `package.json`, then record results in `specs/002-google-oauth-identity/validation-record.md`
- [X] T040 Update the SPEC 002 checkbox in `MILESTONE.md`, `USE_CODEX.md`, and `specs/002-google-oauth-identity/validation-record.md` to record the Go/No-Go decision, acceptance criteria, and unresolved items

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundation)**: Starts after Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Starts after Phase 2 and provides the minimum value for P0.
- **Phase 4 (US2)**: Could technically start after Phase 2, but follows the US1 checkpoint because it reuses the US1 identity API and Tool implementation.
- **Phase 5 (US3)**: Depends on real-device validation results from US1 and US2.
- **Phase 6 (Polish)**: Runs after the required user stories are complete.

### User Story Dependencies

```text
Setup → Foundation → US1 (signed-in identification) → US2 (account isolation) → US3 (Go/No-Go record) → Polish
```

- **US1 (P1)**: Can be verified independently after the foundation is complete.
- **US2 (P2)**: Reuses the US1 API and Tool contract to verify failure and switching states.
- **US3 (P3)**: Records and evaluates observed results from US1 and US2.

### Parallel Execution Examples

#### US1

```text
T016 tests/integration/who-am-i-api.test.ts
T017 tests/unit/register-who-am-i-tool.test.ts
T018 tests/integration/auth-page.test.ts

T019 src/routes/who-am-i.ts
T020 src/webmcp/register-who-am-i-tool.ts
```

#### US2

```text
T026 tests/integration/who-am-i-api.test.ts
T027 tests/unit/identity.test.ts
T028 tests/unit/register-who-am-i-tool.test.ts
```

## Implementation Strategy

### Implement the MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 in Phase 3.
3. Perform ten same-account checks on a real device and confirm User ID agreement.
4. If US1 produces a mismatch or unauthenticated result, stop with No-Go and do not proceed to subsequent Answer submission.

### Deliver Incrementally

1. Establish same-user identification for a logged-in account with US1.
2. Confirm accounts are not confused with US2.
3. Record every case and finalize the P0 Go/No-Go decision with US3.
4. Proceed to P0 validation in SPEC 003 and later only after a Go decision.

## Notes

- Tasks marked `[P]` may run in parallel after prerequisites are complete, provided they touch different files.
- UI text, code comments, and identifiers for this task are written in English.
- Do not include OAuth Secrets, Cookie values, access tokens, or Google account email addresses in commits, fixtures, logs, screens, Tool responses, or validation records.
