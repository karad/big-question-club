# Validation Record: Sealed Answer Access Control

## Environment

- Date/time: 2026-09-02 17:20 JST
- Branch: `008-sealed-answer-access`
- Starting commit: `4a8d82af12d823b5482db0945dc5e40431639e0e`
- Node.js: `v23.6.0` (outside the `package.json` recommended range, but all gates passed)
- Browsers: Codex in-app browser with WebMCP support and Chrome with a separate Session
- Accounts: two test Users with no sensitive data recorded

## Phase 1 Baseline

| Item | Result | Notes |
| --- | --- | --- |
| Typecheck / Lint / Format | Passed | Every pre-change command passed |
| Node Test | Passed | 29 files / 229 tests |
| D1 Test | Passed | 11 files / 42 tests |
| Build / Schema Check | Passed | Build and Drizzle schema check passed |

## Automated Verification

| Item | Result | Notes |
| --- | --- | --- |
| Typecheck / Lint / Format | Passed | `npm run typecheck`, `npm run lint`, `npm run format` |
| Node Test / D1 Test | Passed | 29 files / 557 tests, 12 files / 44 tests |
| Build / Schema Check | Passed | Build in escalated environment and `drizzle-kit check` passed |
| Authorization decision table | Passed | 5 subjects × 4 states × 4 channels × 4 information types = 320 matched 100% |
| Non-enumeration repetition | Passed | Existing, missing, and wrong-Question compared ten times each with zero differences |

## Manual Verification

| Item | Result | Notes |
| --- | --- | --- |
| Pre-Reveal/Closed non-exposure | Passed | Both Users saw count 2 and only their own body/excerpt; zero other-User secrets; no creator privilege |
| Direct HTTP non-enumeration | Passed | Browser blocked top-level JSON navigation, so integration tests covered existing/missing/wrong-Question ten times each, unauthenticated, and abnormal methods; all returned common `404 ANSWER_UNAVAILABLE` |
| Post-Reveal excerpts/lazy body | Passed | Initial SSR contained 2 excerpts and zero bodies; selecting showed one body and zero unselected bodies |
| Zero Answers | Passed | Integration test showed only empty state and generated no false Answer ID |
| Owner-only WebMCP | Passed | Real WebMCP verified submission, `get_my_submission`, and `OPEN`/`CLOSED`/`REVEALED`; exactly five tools and zero counts, other values, or list/detail/search/summary/comparison capabilities |
| Session switching/reuse prevention | Passed | Two browser Sessions showed only own values; after A signed out, `get_my_submission` returned `AUTHENTICATION_REQUIRED` and zero own values |
| Cache headers | Passed | Integration tests confirmed `Cache-Control: private, no-store` and `Vary: Cookie` for success, denial, exception, and unsupported paths |

## Unresolved Items

- None. Only non-sensitive SPEC 008 fixtures were added to local D1; shared D1 was unchanged.
