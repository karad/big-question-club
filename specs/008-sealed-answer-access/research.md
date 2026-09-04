# Technical Research: Sealed Answer Access Control

## 1. Authorization Policy

**Decision**: Centralize a pure decision table in the `answer-visibility` domain. It accepts `authenticated`, route purpose, Question state, and information type and returns allow/deny. Creators receive no special treatment.

**Rationale**: Every route uses identical rules, and at least 180 combinations can be covered without external dependencies.

**Alternatives Considered**: Per-route branching was rejected because it drifts; role-based authorization was rejected because it introduces unnecessary creator privilege.

## 2. Channel Identity

**Decision**: Fix route purpose as `human-ssr`, `human-detail`, `self-submission`, or `webmcp-question`, never a spoofable header.

**Rationale**: Each registered route can be statically limited to its permitted information.

**Alternatives Considered**: Human/Agent headers and generic Answer APIs were rejected because they overexpose data.

## 3. State and Time

**Decision**: Capture service time once per request and share the existing `getQuestionState` snapshot across screen rendering and authorization.

**Rationale**: Crossing a boundary mid-request cannot mix sealed UI with disclosed data.

**Alternatives Considered**: Per-query reevaluation and stored state names conflict with existing contracts.

## 4. Safe Projections

**Decision**: Separate answer count, own Answer, post-Reveal excerpts, and selected body, retrieving only domain-authorized projections from the repository.

**Rationale**: Prevents accidental serialization of unnecessary columns such as User and individual times.

**Alternatives Considered**: Fetch-all then route-filter and a dedicated public table were rejected for secret-data ingress and duplicated storage.

## 5. Detail Non-Enumeration

**Decision**: Return the same `404 ANSWER_UNAVAILABLE` for unauthenticated, pre-Reveal, missing, and wrong-Question requests; retrieve body only after authorization.

**Rationale**: Status, code, and body reveal neither existence nor cross-Question association and remain compatible with SPEC 004.

**Alternatives Considered**: Distinct `401`/`403`/`404` results assist identifier enumeration.

## 6. Response-Reuse Prevention

**Decision**: Add `Cache-Control: private, no-store` and `Vary: Cookie` to User-dependent success and failure.

**Rationale**: Prevents reuse of own Answers and Reveal results by shared caches or another Session.

**Alternatives Considered**: `no-cache` still permits storage; putting User IDs in URLs breaks identity contracts.

## 7. Untrusted Answers

**Decision**: Treat bodies and excerpts as escaped text. Initial SSR returns excerpts; successful detail returns only one body.

**Rationale**: Stored Answers remain untrusted after authorization.

**Alternatives Considered**: HTML stripping changes source text; Markdown/HTML rendering is unnecessary here.

## 8. Test Allocation

**Decision**: Verify the decision table with unit tests; authentication, headers, SSR, HTTP, and WebMCP non-exposure with Hono integration tests; projections and cross-Question isolation with D1 integration tests; and real Sessions through quickstart manual E2E.

**Rationale**: This isolates branch causes while verifying final publication paths.

**Alternatives Considered**: E2E-only or unit-only testing cannot cover the required boundaries.
