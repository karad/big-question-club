# Technical Research: Challenge Core Browsing Flow

## 1. Implementation Boundary

**Decision**: SPEC 009 implements only the Home and Question Detail core features. It excludes a dedicated Login page, redesign of My Questions, final visual design, and Reveal comparison presentation.

**Rationale**: Complete the functionality on September 2 and reserve September 3 for presentation work that communicates the Challenge effectively.

**Alternatives Considered**: Completing all four primary screens and comprehensive quality at once was rejected because it would delay work on Reveal and presentation.

## 2. Home List Projection

**Decision**: `listOpenQuestions(snapshotNow)` retrieves only published Questions satisfying `publishedAt <= now < closesAt` and their answer counts, ordered by `closesAt ASC, publishedAt ASC, id ASC`.

**Rationale**: This avoids N+1 queries and prevents unpublished Questions and Answer secrets from entering the Home data path, while retrieving only the information Home needs in one query.

**Alternatives Considered**: Fetching every Question before filtering and fetching answer counts per Question were rejected because both weaken the safety boundary and time efficiency.

## 3. Question State Snapshot

**Decision**: Home and Question Detail obtain `now()` once per request and use the same value for the existing `getQuestionState`, list filtering, remaining time, and Prompt availability.

**Rationale**: This prevents Open presentation and Closed behavior from being mixed in a single response that crosses a deadline boundary.

**Alternatives Considered**: Obtaining time separately for queries or display fields and determining state from client time were rejected because they introduce inconsistency.

## 4. Viewer and Current User's Submission

**Decision**: Derive `anonymous`, `authenticated-unsubmitted`, `authenticated-submitted`, and `submission-unavailable` as mutually exclusive states. Use creator matching only as a presentation aid, never for Answer authorization.

**Rationale**: This prevents simultaneous display of an unanswered Prompt and the current user's Answer, avoids mistaking a failure for an unanswered state, and preserves SPEC 008's rule that creators receive no special privilege.

**Alternatives Considered**: Scattering individual conditions throughout routes was rejected because it is prone to presentation contradictions.

## 5. Authentication Flow

**Decision**: Reuse the existing Google Sign in operation and guide signed-out users from Question Detail to the existing authentication entry point. Do not add a dedicated Login page or arbitrary-page return-destination handling.

**Rationale**: Existing authentication already works for the Core Demo, so the participation flow can be completed without introducing new open-redirect countermeasures or a client-authentication redesign.

**Alternatives Considered**: A dedicated Login page and `returnTo` allowlist would be useful for product quality, but were deferred because they do not strengthen the Challenge Core differentiator.

## 6. Visual Design Boundary

**Decision**: SPEC 009 fixes the information structure and stable DOM hooks only. SPEC 010 completes the final typography, color, layout, motion, and responsive presentation across Home, sealed content, and Reveal.

**Rationale**: This does not de-emphasize appearance; it concentrates September 3 on a consistent visual direction after functionality is complete.

**Alternatives Considered**: Creating temporary CSS in SPEC 009 and rebuilding it in SPEC 010 was rejected as duplicate work.

## 7. Integration with Existing Specifications

**Decision**: Reuse the Agent request Prompt and clipboard behavior from SPEC 007, and Answer authorization, the current user's Answer, and minimal Reveal presentation from SPEC 008. The Agent request Prompt uses the finalized one-line wording that requires ChatGPT's built-in browser rather than an existing Chrome tab and includes an absolute Question URL following the current origin. Context-evidence and safety details are passed to the Agent by each WebMCP tool contract. Tool contracts prioritize the user's own explicit or repeated statements from the current conversation, available past conversations, and Project Context, and do not treat assistant suggestions or options still under consideration as settled facts. If no explicit personal view exists, create and submit the best answer on the user's behalf without asserting unverified personal facts or presenting a belief as known, and do not ask the human solely because that context is missing. The Prompt itself authorizes the initial submission, so no additional preview or approval is required.

**Rationale**: Do not break the already device-verified central Challenge feature and safety boundaries through short-term changes.

**Alternatives Considered**: Creating separate Answer retrieval or Prompts for the UI was rejected because it duplicates contracts and adds leakage paths.

## 8. Test Allocation

**Decision**: Verify answer counts, remaining time, and viewer state with unit tests; SSR, authentication, and non-exposure of secrets with Hono integration tests; and the Open list with D1 integration tests. Conduct manual testing for the complete Core Demo after the SPEC 010 screens are complete.

**Rationale**: Reach functional completion with automated regression protection today, without manually verifying the same flow twice after tomorrow's visual changes.

**Alternatives Considered**: Comprehensive browser verification for SPEC 009 alone was rejected because SPEC 010 changes the DOM and appearance.

## 9. Single-Administrator Identification

**Decision**: Configure one normalized email in `ADMIN_EMAIL`. Retrieve the database user by the session-derived user ID, and grant administrator authority only when the email matches exactly. Fail closed when configuration is invalid.

**Rationale**: This reuses the existing email verified through Google Login and prevents privilege escalation through input values without requiring advance discovery of a user ID or a separate password.

**Alternatives Considered**: Configuring a user ID is stable but requires advance retrieval. A database role was rejected because it adds multiple administrators and role management.

## 10. Audit Records

**Decision**: Append records to `audit_logs` using session triggers for login/logout and D1 triggers on the Question/Answer tables for input operations. Store only actor, action, target, outcome, and time; do not duplicate bodies, excerpts, or authentication secrets.

**Rationale**: This prevents missed records despite multiple entry points such as routes and WebMCP, preserves the operational history after deletion, and avoids duplicating sensitive values or inappropriate content.

**Alternatives Considered**: Per-route records are prone to implementation omissions and partial success. Body snapshots contradict the meaning of deletion and data minimization.

## 11. Administrator Deletion

**Decision**: Question deletion removes child Answers using the existing foreign-key cascade. Answer deletion removes only the specified record. Commit the mutation and a dedicated audit record containing the administrator actor in the same D1 batch. Do not provide editing operations.

**Rationale**: The target scope is unambiguous, partial success is avoided, and administrator operations can be distinguished from trigger-recorded regular-user operations.

**Alternatives Considered**: Soft deletion was rejected because it would require exclusion changes to every public query and restoration permissions, exceeding the minimum operations needed by the deadline.

## 12. Ban Enforcement

**Decision**: Use `banned_users` as the source of truth, delete all of the target user's sessions when banning, reject new sessions by checking bans in the Better Auth before-session-creation hook, and unban by deleting the ban row. Reject attempts to ban the administrator.

**Rationale**: This closes both existing-session and re-login paths while allowing a ban to be removed safely without deleting the user.

**Alternatives Considered**: Deleting a user breaks Question/Answer referential integrity and audit traceability, while deleting sessions alone still permits re-login.
