# Validation Record: Question Creation and Publication Flow

## Pre-Implementation Baseline (2026-09-02)

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format`: passed
- `npm test`: 118 tests across 19 files passed
- `npm run test:d1`: 21 tests across 8 files passed, run in an escalated environment because it uses a local port
- `npm run build`: passed

There were no unresolved pre-implementation items. The Node.js `punycode` deprecation warning shown by D1 tests comes from an existing dependency and does not affect results.

## Post-Implementation (2026-09-02)

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format`: passed
- `npm test`: 198 tests across 21 files passed
- `npm run test:d1`: 36 tests across 9 files passed, run in an escalated environment because it uses a local port
- `npm run build`: passed, with final verification in an escalated environment to avoid Wrangler log-output restrictions

The input contract was verified with at least thirty cases, Question-management authentication, ownership, CSRF, and display contracts with at least twenty cases, and `My Questions` with at least fifteen display cases. D1 tests confirmed that publication commits only once under both ten sequential and ten concurrent requests.

Manual verification with local D1 and two Google OAuth Users covered draft creation, retained input, editing, Review, publication acknowledgment, exactly-once publication, post-publication edit rejection, four-state lists, User B's empty state, ownership non-enumeration, and absence of Answer content. A defect found during manual testing—displaying an empty deadline initially as the Unix epoch—was fixed and reverified.

No implementation items remain unresolved. The Node.js `punycode` deprecation warning comes from an existing dependency. No migration was applied to shared D1 in this specification; follow the existing deployment procedure.
