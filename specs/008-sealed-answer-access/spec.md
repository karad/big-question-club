# Feature Specification: Sealed Answer Access Control

**Feature Branch**: `008-sealed-answer-access`

**Created**: 2026-09-02

**Status**: Draft

**Input**: "Implement SPEC 008 — Sealed Answer Access Control from MILESTONE.md"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Seal Other Users' Answers on Every Path Before Reveal (Priority: P1)

While a Question is `DRAFT`, `OPEN`, or `CLOSED`, neither its creator, an answered or unanswered Human, an unauthenticated User, nor a Personal Agent can retrieve another User's Answer body, excerpt, preview, summary, identifier, submitter, individual timestamp, or derived clue through SSR, HTTP API, or WebMCP.

**Why this priority**: Independent answers uninfluenced by others are the core value; one leaking path defeats Sealed Answers.

**Independent Test**: Attempt guessed Answer access for a Draft and exercise all public paths at fixed `OPEN` and `CLOSED` times for an unauthenticated User, creator, submitter, another authenticated Human, and Personal Agent against two distinguishable Answers. Confirm zero other-User values beyond permitted personal data.

**Acceptance Scenarios**:

1. **Given** an `OPEN` Question has at least two Answers, **When** an authenticated Human views it, **Then** they see count, deadline, sealed state, and their own Answer if submitted, with no other-User content or identifiers displayed or embedded.
2. **Given** such a Question is `CLOSED` before Reveal, **When** Human screen or HTTP is used, **Then** closing is visible but other-User disclosure remains identical to `OPEN`.
3. **Given** a Question is `DRAFT`, `OPEN`, or `CLOSED`, **When** a guessed Answer ID is sent directly to detail HTTP, **Then** one common unavailable result reveals neither existence, ownership, nor Question association.
4. **Given** a Question is `OPEN` or `CLOSED`, **When** a Personal Agent calls available tools, **Then** no other-User body, excerpt, preview, summary, ID, submitter, time, or submission existence is returned.

---

### User Story 2 - View Only Necessary Counts and Own Answer (Priority: P1)

Authenticated Humans and their Personal Agents safely check their own submission on published Questions and, when submitted, retrieve their own body, excerpt, submission time, and update time in every state. Answer count is aggregate-only on Human paths; WebMCP omits it to prevent inference about others.

**Why this priority**: Humans need to verify participation and public content without personal-state features leaking other Users.

**Independent Test**: With two Users answered, inspect personal state in `OPEN`, `CLOSED`, and `REVEALED`. Human paths return correct count and own Answer; WebMCP returns only own Answer and no other-derived values.

**Acceptance Scenarios**:

1. **Given** an authenticated Human answered a published Question, **When** Human screen or personal HTTP is used, **Then** their body, excerpt, submission time, and update time are available in `OPEN`, `CLOSED`, and `REVEALED`.
2. **Given** the Human did not answer but others did, **When** personal state is checked, **Then** only personal non-submission is returned, with a response shape independent of others.
3. **Given** multiple Answers exist, **When** an authenticated Human views the Question screen, **Then** the exact count appears, with no additional pre-Reveal clues.
4. **Given** the same Question and User state, **When** a Personal Agent checks Question or personal state, **Then** no count, other-User submission existence, or other-derived information is returned.

---

### User Story 3 - Let Only Authenticated Humans Read All Answers After Reveal (Priority: P1)

When a Question becomes `REVEALED`, authenticated Humans can see every excerpt in SSR and retrieve only a selected body through Human detail HTTP. Unauthenticated Users and Personal Agents still cannot access other Users' Answers.

**Why this priority**: Human comparison after the proper time is the result of sealed participation, while Agent non-disclosure remains required.

**Independent Test**: With at least two Answers on a `REVEALED` Question, exercise SSR, detail HTTP, and WebMCP as authenticated Human, unauthenticated User, and Personal Agent. Only the authenticated Human receives all excerpts and a selected body.

**Acceptance Scenarios**:

1. **Given** a `REVEALED` Question has at least two Answers, **When** an authenticated Human views it, **Then** all excerpts appear in stable order while no body is fetched or embedded before selection.
2. **Given** that excerpt list, **When** one is selected, **Then** only the corresponding body is returned.
3. **Given** `REVEALED`, **When** an unauthenticated User directly accesses SSR or detail HTTP, **Then** no body, excerpt, ID, or existence clue is returned.
4. **Given** `REVEALED`, **When** a Personal Agent uses WebMCP, **Then** it receives only personal state/Answer and no other body, excerpt, ID, submitter, time, or count.
5. **Given** a `REVEALED` Question has zero Answers, **When** an authenticated Human views it, **Then** the empty state appears and no nonexistent Answer or ID is generated.

---

### User Story 4 - Regression-Test Direct Access and Time Boundaries (Priority: P2)

Developers can repeatedly verify every subject, channel, Question state, and information category against one access table using Question state as the sole decision source. Guessed URLs, nonexistent IDs, expired authentication, caching, and boundaries reached mid-processing never leak unauthorized Answer data.

**Why this priority**: Happy-path screens alone cannot prevent authorization regressions through direct HTTP, time boundaries, or future routes.

**Independent Test**: Execute the access table across unauthenticated User, submitter, creator, another Human, and Personal Agent; four states; SSR/HTTP/WebMCP; and count/own/other data. Confirm expected decisions and no secrets.

**Acceptance Scenarios**:

1. **Given** immediately before a deadline or Reveal, **When** each path is requested before, exactly at, and after the boundary, **Then** every path follows the same service-side state and changes uniquely to the later state at the boundary.
2. **Given** existing, missing, and wrong-Question Answer IDs, **When** direct HTTP is attempted by a forbidden subject/state, **Then** all three yield one indistinguishable result.
3. **Given** the Session is invalid before or during an authenticated response, **When** own or revealed Answers are accessed, **Then** protected data is absent and no previous User response is reused.
4. **Given** a Question changes from `CLOSED` to `REVEALED` during retrieval, **When** other Answers are requested, **Then** content remains consistent with the single authorization snapshot and no partial excerpt/body is returned.

### Edge Cases

- With identical deadline and Reveal, just before is `OPEN` and the boundary onward is `REVEALED`; never both answerable and disclosed.
- With a later Reveal, `CLOSED` ends acceptance but keeps the `OPEN` sealed scope.
- A `DRAFT` is hidden outside creator management and returns no Answer data.
- A creator who did not answer has no pre-Reveal access to others.
- A direct request confusing own and other Answer IDs neither reassigns ownership nor returns another User's Answer.
- A wrong-Question Answer ID behaves like absence and leaks no association.
- HTML, script, URLs, control characters, or secret-like strings in body/excerpt never enter forbidden bodies, attributes, embedded data, logs, or errors.
- HEAD, unsupported methods, invalid parameters, and excessive queries create no alternate content/existence path.
- Persistence or authentication failure returns no partial success, internal exception, authentication data, or Answer content.
- User-dependent screens and responses are never reused for another or unauthenticated User.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST use current `DRAFT`, `OPEN`, `CLOSED`, or `REVEALED`, derived from publication and service time, as the sole state source for Answer disclosure.
- **FR-002**: The system MUST use one consistent Question state per retrieval/screen generation and MUST NOT override it with channel-specific comparisons or device time.
- **FR-003**: The system MUST classify Answer data as answer count, own Answer, or other Answers and follow one subject/channel/state policy.
- **FR-004**: The system MUST treat `DRAFT` as unavailable outside creator management and disclose neither Question nor Answer existence on public paths.
- **FR-005**: For `OPEN` and `CLOSED`, the system MUST NOT return other-User body, excerpt, preview, summary, ID, submitter, submission time, or update time to any unauthenticated User, creator, other Human, or Personal Agent.
- **FR-006**: The system MUST NOT grant creators pre-Reveal privilege over other Answers.
- **FR-007**: Authenticated Human SSR MAY return aggregate answer count for published Questions using the same rule in `OPEN`, `CLOSED`, and `REVEALED`.
- **FR-008**: WebMCP Question and personal-state responses MUST omit counts and MUST NOT vary fields based on others' submissions.
- **FR-009**: An authenticated User MUST be able to check personal state on published Questions and retrieve only their body, excerpt, submission time, and update time in any state when submitted.
- **FR-010**: Personal non-submission MUST be identical regardless of other submissions and counts.
- **FR-011**: For `REVEALED`, authenticated Human SSR MAY list only every Answer ID and excerpt and MUST NOT embed bodies initially.
- **FR-012**: Only when an authenticated Human selects one Answer from a `REVEALED` list MAY Human detail HTTP return that Answer's ID and body within the Question.
- **FR-013**: Human Answer lists/details MUST be limited to `REVEALED` and unavailable in `DRAFT`, `OPEN`, or `CLOSED`.
- **FR-014**: The system MUST NOT return own Answer, all-Answer list, body, excerpt, or ID to unauthenticated Users in any state.
- **FR-015**: WebMCP MUST never return another User's body, excerpt, preview, summary, ID, submitter, individual times, update time, or count.
- **FR-016**: WebMCP MUST expose no capability for other-User Answer listing, detail, search, summary, or comparison.
- **FR-017**: Unauthorized Human detail HTTP MUST return one unavailable result that does not distinguish existing, missing, or wrong-Question Answers.
- **FR-018**: Identity MUST come only from a valid Session, never User IDs in URL, path, query, or body.
- **FR-019**: SSR/HTTP responses containing Answers or varying by authentication MUST NOT be reused for another or unauthenticated User.
- **FR-020**: Authorization, missing-target, invalid-input, and retrieval errors MUST contain no body, excerpt, ID, submitter, authentication data, or internal exception.
- **FR-021**: Even for authorized Humans, body/excerpt MUST NOT be interpreted as executable content, screen structure, attributes, or unvalidated embedded data.
- **FR-022**: The system MUST maintain a regression matrix combining five subjects, four states, SSR/HTTP/WebMCP channels, and count/own/other categories.
- **FR-023**: Regression tests MUST include before/at/after boundaries, existing/missing/wrong-Question IDs, expired authentication, and zero/multiple Answers.
- **FR-024**: This specification MUST NOT provide finished Home/Question Detail UI, final post-Reveal ordering, voting/ranking/search/summaries, unauthenticated disclosure, WebMCP other-Answer disclosure, or administrator privilege.

### Key Entities

- **Question**: Target prompt whose publication, deadline, and Reveal times make current state the sole Answer-disclosure source.
- **Question State**: Exclusive `DRAFT`, `OPEN`, `CLOSED`, or `REVEALED`; `OPEN`/`CLOSED` seal other Answers, and only `REVEALED` permits authenticated Human disclosure.
- **Answer**: A User's intended-public response with body, excerpt, submitter, Question, submission time, and update time; access distinguishes own from other.
- **Authentication Subject**: Unauthenticated User, creator, submitter, another authenticated Human, or Personal Agent. Creators have no pre-Reveal privilege; Personal Agents handle only own Answers.
- **Publication Channel**: SSR, Human HTTP API, or WebMCP. All use the same state and policy; only authenticated Human paths read other Answers after Reveal.
- **Answer Disclosure Data**: Authorization units of count, own Answer, and other Answers, including content and clues such as excerpt, preview, summary, IDs, submitter, and individual times.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Expected allow/deny matches 100% across the matrix of five subjects, four states, and three publication channels.
- **SC-002**: In `DRAFT`, `OPEN`, and `CLOSED`, SSR/direct HTTP/WebMCP expose zero bodies, excerpts, previews, summaries, IDs, submitters, or individual times from distinguishable other-User Answers.
- **SC-003**: At one unit before, exactly at, and one unit after Reveal, authenticated Human other-Answer disclosure succeeds only at/after 100%; Personal Agent disclosure remains zero throughout.
- **SC-004**: Ten forbidden direct requests each for existing, missing, and wrong-Question IDs expose zero differentiating results or Answer data.
- **SC-005**: A submitter retrieves their Answer 100% in `OPEN`, `CLOSED`, and `REVEALED`; a non-submitter's response never varies based on others.
- **SC-006**: Authenticated Human `REVEALED` lists show every excerpt and zero bodies initially; selecting one returns exactly one corresponding body.
- **SC-007**: Consecutive responses for authenticated Users with different Answers have zero cross-User or unauthenticated mixing.
- **SC-008**: Using the documented matrix and procedure, a developer can assess all-channel pre-Reveal non-exposure, boundaries, Human-only Reveal, and owner-only WebMCP within sixty minutes.

## Assumptions

- Reuse SPEC 005 Question state with no channel-specific alternatives.
- SPEC 006 sets deadline equal to Reveal in MVP, but access also supports future `CLOSED` intervals and stays sealed until Reveal.
- SPEC 007 WebMCP continues handling only Human-selected Questions and own Answers, even after Reveal.
- Aggregate count contains no body, excerpt, ID, or submitter and is safe for authenticated Human Question screens.
- Post-Reveal Answer viewers are limited to Humans with valid Sessions; unauthenticated disclosure is out of MVP scope.
- Preserve current stable submission order by default; SPEC 010 decides final comparison and ordering.
- Common unauthorized detail results prioritize preventing Answer-level distinction over explaining reauthentication versus absence.

## Dependencies

- SPEC 002 provides consistent authenticated User identity in Human screens and WebMCP.
- SPEC 004 provides foundational non-exposure and post-Reveal Human verification across three channels.
- SPEC 005 provides four exclusive states and boundaries.
- SPEC 007 provides owner-Answer retrieval and no-other-Answer tool contracts.

## Out of Scope

- Finished Home, Question Detail, Login, My Questions layout/navigation/accessibility (SPEC 009)
- Post-Reveal comparison, final ordering, participant differences, and finished empty-state UI (SPEC 010)
- Voting, ranking, search, recommendation, summarization, or Agent debate
- Other-User Answer disclosure to WebMCP or unauthenticated Users
- Administrator deletion, audit logs, and retention periods
