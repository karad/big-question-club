# Feature Specification: Domain Data Model and Question Lifecycle

**Feature Branch**: `005-domain-data-lifecycle`

**Created**: 2026-09-02

**Status**: Draft

**Input**: "Implement SPEC 005 — Domain Data Model and Question Lifecycle"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Determine the Current Question State Unambiguously (Priority: P1)

The service determines exactly one current state—`DRAFT`, `OPEN`, `CLOSED`, or `REVEALED`—from whether a Question has been published, its answer deadline, its reveal time, and the service's current time. Human-facing screens, Personal Agent features, answer acceptance, and Answer publication can use this same result in later specifications.

**Why this priority**: If answer acceptance and Sealed Answer publication use different state interpretations, the service could accept submissions after the deadline or leak information before reveal.

**Independent Test**: Use a fixed reference time and Questions that are unpublished, published before their deadlines, past their deadlines but before reveal, and past reveal. Confirm that each Question resolves to only its expected state.

**Acceptance Scenarios**:

1. **Given** a Question whose publication time is not set, **When** its current state is determined, **Then** only `DRAFT` is returned regardless of the other timestamps.
2. **Given** a published Question and a service time before its answer deadline, **When** its current state is determined, **Then** only `OPEN` is returned.
3. **Given** a published Question whose answer deadline has arrived but whose reveal time has not, **When** its current state is determined, **Then** only `CLOSED` is returned.
4. **Given** a published Question whose reveal time has arrived, **When** its current state is determined, **Then** only `REVEALED` is returned.
5. **Given** identical answer deadline and reveal times, **When** the state is evaluated immediately before and exactly at that boundary, **Then** the results are `OPEN` before it and `REVEALED` at it, with no overlap between accepting submissions and published Answers.

---

### User Story 2 - Persist User, Session, Question, and Answer Relationships Consistently (Priority: P1)

The service persists the authenticated User, the Session representing that User's authentication state, Questions created by the User, and Answers submitted to Questions by the User's Personal Agent without losing ownership or reference relationships. It never creates orphaned data referencing a nonexistent User or Question.

**Why this priority**: If the mappings among the authenticated subject, Question creator, and Answer submitter break down, identity verification, one answer per person, and publication control all fail.

**Independent Test**: In an empty migrated store, save two Users, their Sessions, one Question, and two Answers. Confirm that owners and target Questions are restored correctly and that missing references and duplicate Answers are rejected.

**Acceptance Scenarios**:

1. **Given** a valid User, **When** that User's Session and Question are saved, **Then** both are associated with the same User and the relationship remains after retrieval.
2. **Given** a valid User and an `OPEN` Question, **When** the User's Answer is saved, **Then** exactly one Answer associated with both User and Question is stored.
3. **Given** the same User already has an Answer to the same Question, **When** a second Answer is saved, **Then** the existing Answer is unchanged and the duplicate is not stored.
4. **Given** the referenced User or Question does not exist, **When** a Session, Question, or Answer is saved, **Then** no orphaned data is created and the operation is identifiable as a persistence failure.

---

### User Story 3 - Reject Writes That Violate the Lifecycle (Priority: P2)

The service enforces invariants about Question timestamp ordering and state at the persistence boundary. It never commits an invalid rollback of a published Question, Answer creation outside `OPEN`, or reassignment of Answer ownership, regardless of access path.

**Why this priority**: Even correct state evaluation cannot provide a safe foundation for later features if invalid data can still be persisted.

**Independent Test**: Attempt valid transitions, reversed timestamps, skipped states, rollback to earlier states, and Answer creation in `DRAFT`, `CLOSED`, and `REVEALED`. Confirm that only valid changes commit.

**Acceptance Scenarios**:

1. **Given** a `DRAFT` Question with a consistent publication, deadline, and reveal schedule, **When** publication is confirmed, **Then** it becomes `OPEN` and cannot return to its unpublished state.
2. **Given** an `OPEN` Question reaches its answer deadline, **When** its current state is determined, **Then** it becomes `CLOSED` before reveal or `REVEALED` if reveal has also arrived.
3. **Given** a Question is `DRAFT`, `CLOSED`, or `REVEALED`, **When** a new Answer is saved, **Then** the Answer is not stored.
4. **Given** publication, answer deadline, and reveal times are ordered incorrectly, **When** the Question is saved or published, **Then** the inconsistent Question is not committed as published.

---

### User Story 4 - Verify the Data Contract After Migration (Priority: P3)

Developers can automatically confirm that required structures, constraints, relationships, and state evaluation work in both an empty store and one upgraded from the existing schema. If an upgrade fails, a partially migrated contract is not treated as success.

**Why this priority**: The production data model must be introduced safely not only in development but also into environments containing existing authentication data.

**Independent Test**: Run the full migration against an empty store and the differential migration from the SPEC 004 schema, then confirm that the same constraint and state-boundary tests pass in both.

**Acceptance Scenarios**:

1. **Given** an empty store, **When** all migrations are applied in order, **Then** persistence and constraint verification can begin for User, Session, Question, and Answer.
2. **Given** a store containing authentication data from SPEC 004, **When** the differential migration is applied, **Then** it upgrades to the new contract without losing valid Users or Sessions.
3. **Given** a constraint violation occurs during migration, **When** the result is verified, **Then** it is not treated as success and the failure point can be identified.

### Edge Cases

- At the exact answer deadline, a Question is not `OPEN`. If reveal is simultaneous it is `REVEALED`; otherwise it is `CLOSED`.
- When answer deadline and reveal time are identical, `CLOSED` may last zero time, but the result must never overlap two states.
- A Question without a confirmed publication time remains `DRAFT` and accepts no Answers even if its deadline or reveal time is in the past.
- Timestamps must satisfy `publication time < answer deadline <= reveal time`.
- Scheduled publication is out of scope, so a Question must not be classified as `OPEN` using a future publication time.
- Uniqueness is preserved even under concurrent attempts to create the same Session value, the same User/Question Answer, or the same external authentication subject.
- If a Question reaches its deadline while an Answer is being saved, do not commit the Answer unless it is `OPEN` at the service time used to commit the write.
- If a referenced User or Question becomes subject to deletion, do not leave orphaned Sessions or Answers. Deletion itself is out of scope.
- If existing validation Questions or Answers do not satisfy the production contract, they may be explicitly replaced as validation data without involving authentication Users or Sessions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST persist User, Session, Question, and Answer records and distinguish each with a stable unique identifier.
- **FR-002**: The system MUST associate a Session with one User and retain its expiration, unique authentication value, creation time, and update time.
- **FR-003**: The system MUST associate a Question with its creator User and retain its body, publication time, answer deadline, reveal time, creation time, and update time. The existing language column is for schema compatibility only and MUST NOT be used for product language selection.
- **FR-004**: The system MUST associate an Answer with one User and one Question and retain its body, single-line excerpt, and creation time.
- **FR-005**: The system MUST allow at most one Answer per User/Question pair and reject duplicates, including concurrent writes, at the persistence boundary.
- **FR-006**: The system MUST NOT persist a Session or Question referencing a nonexistent User, or an Answer referencing a nonexistent User or Question.
- **FR-007**: The system MUST define and enforce referential-integrity rules at the persistence boundary so deletion or replacement does not create orphaned User, Session, Question, or Answer records.
- **FR-008**: The system MUST store and compare all domain times as absolute times on a universal time basis and MUST NOT use display time zones or a user's device clock for state evaluation.
- **FR-009**: The system MUST restrict a Question's publication time to no later than the service time when publication is confirmed, enforce `publication time < answer deadline <= reveal time`, and MUST NOT commit a Question that violates this ordering as published.
- **FR-010**: The system MUST classify a Question as `DRAFT` when its publication time is unset, `OPEN` when published and before its answer deadline, `CLOSED` at or after its answer deadline and before reveal, and `REVEALED` at or after reveal.
- **FR-011**: When current time equals the answer deadline or reveal time, the system MUST prefer the later state and always return exactly one current state.
- **FR-012**: The system MUST NOT commit changes that return a published Question to `DRAFT`, return a `CLOSED` or `REVEALED` Question to `OPEN`, or return a `REVEALED` Question to any earlier state.
- **FR-013**: The system MUST commit Answer creation only when the Question is `OPEN`, using the same service reference time for state evaluation and Answer persistence.
- **FR-014**: The system MUST provide the current-state rules as a single domain contract so persistence, retrieval, and later screen, HTTP, and WebMCP paths use the same result.
- **FR-015**: The system MUST define responsibility boundaries for persisting and retrieving User, Session, Question, and Answer so callers can distinguish uniqueness, referential-integrity, and state-condition outcomes without knowing persistence details.
- **FR-016**: The system MUST apply all migrations to an empty store and apply a differential migration to a SPEC 004 store while preserving valid Users and Sessions.
- **FR-017**: The system MUST automatically verify required fields, uniqueness, referential integrity, timestamp ordering, state boundaries, and Answer rejection outside `OPEN` after migration.
- **FR-018**: The system MUST repeatedly verify the state rules, time boundaries, invalid transitions, and duplicate/reference constraints defined here without external services or the passage of real time.
- **FR-019**: Within this specification, the system MUST NOT provide a Question creation screen, publication UX, WebMCP Tool contract, authorization for the Answer publication path, Human-facing browsing screens, or administrator deletion.

### Key Entities

- **User**: The shared subject representing an authenticated Human and their Personal Agent in Big Question Club. It has a stable identifier, basic display information, creation and update times, and owns Sessions, created Questions, and submitted Answers.
- **Session**: Expiring data representing a User's authenticated state. It is associated with a User, a unique authentication value, expiration, creation, and update times. The authentication value itself is not public domain data.
- **Question**: A prompt created by a Human and answered by Personal Agents. It has a creator, body, publication time, answer deadline, reveal time, creation time, and update time. Its current state is derived unambiguously from these timestamps and service time, not a stored state name.
- **Answer**: A response submitted to a Question by a Personal Agent acting as an authenticated User. It has a Question, User, body, single-line excerpt, and creation time, and is unique for each Question/User pair.
- **Question State**: The mutually exclusive result `DRAFT`, `OPEN`, `CLOSED`, or `REVEALED`. It is the sole lifecycle contract used by answer acceptance and later publication control.
- **Migration**: An ordered unit of change that upgrades an existing store to the new data contract. Its order, success or failure, and resulting constraints are verifiable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least twenty state-evaluation cases covering `DRAFT`, `OPEN`, `CLOSED`, `REVEALED`, and every boundary match their expected state 100% of the time, with zero cases producing multiple states or no state.
- **SC-002**: After ten sequential and ten concurrent attempts by the same User to answer the same Question, exactly one Answer is stored in each verification and zero existing Answers are overwritten.
- **SC-003**: Attempts involving nonexistent references, invalid timestamp ordering, rollback to an earlier state, and Answer creation outside `OPEN` commit zero invalid records.
- **SC-004**: Migration and all constraint checks succeed in at least one empty store and one SPEC 004 store, with zero valid Users or Sessions missing from the latter.
- **SC-005**: Automated state and data-integrity verification using a fixed reference time produces identical results across ten consecutive runs, with zero cases requiring an external service or real-time wait.
- **SC-006**: Using the documented procedure, a developer can verify migration application, four-state boundaries, uniqueness, referential integrity, and Answer acceptance conditions within thirty minutes.

## Assumptions

- Continue using the User, Session, and external-authentication-subject mapping established in SPEC 002 as the authentication foundation of the production data model.
- In the MVP, answer deadline and reveal time may be identical. At that boundary the state changes directly and exclusively from `OPEN` to `REVEALED`, so `CLOSED` lasts zero time. If reveal is delayed later, the interval between them is `CLOSED`.
- `DRAFT` is represented by an unset publication time. After publication, current state is derived from timestamps rather than a stored state name.
- "Current time" means a universal absolute time received by the service; a user's local time zone is used only for display.
- The service clock is synchronized and does not move backward within one operation. Scheduled publication is out of scope; publication time is set when publication is confirmed.
- Questions and Answers created in SPEC 004 are validation-only data and may be replaced if they do not satisfy the new production contract. Users and Sessions are valid authentication data and remain intact through migration.
- The Answer body and excerpt constraints and the one-Answer-per-Question-per-User principle established in SPEC 004 remain in effect.

## Dependencies

- SPEC 002, "Verify Google OAuth and WebMCP User Identification," is complete and its User/Session authentication data contract is available.
- SPEC 004, "Verify Agent Answer Submission Integrity and Sealed Answers," is complete and its validation results for Question, Answer, uniqueness, and deadline boundaries are available.

## Out of Scope

- Question body and deadline input rules, Question creation screen, publication operation, and My Questions (SPEC 006)
- Input/output and error contracts for WebMCP Question retrieval and Answer submission tools (SPEC 007)
- Answer publication authorization and leakage-prevention matrix across SSR, direct HTTP, and WebMCP (SPEC 008)
- Human-facing screens, display ordering, and accessibility during the answer period and after reveal (SPEC 009 and SPEC 010)
- Administrator deletion of User, Question, or Answer; audit logs; and retention periods
- Voting, ranking, summarization, search, Agent-to-Agent conversation, and Personal Context storage
