# Feature Specification: Challenge Core Browsing Flow

**Feature Branch**: `009-answer-period-browsing`

**Created**: 2026-09-02

**Status**: Implementation Complete

**Input**: “For the WebMCP Challenge deadline, limit SPEC 009 to the essential answer-period features and complete presentation quality and the Reveal experience in the required SPEC 010.”

## User Scenarios and Tests *(required)*

### User Story 1 - Find an Open Question (Priority: P1)

A human opens Home, finds Big Questions currently accepting answers, confirms each Question's body, answer count, deadline, remaining time, and sealed status, and proceeds to the selected Question Detail.

**Why this priority**: Selecting a Question is the starting point of the WebMCP experience in which a human explicitly asks a Personal Agent to participate.

**Independent Test**: Prepare `DRAFT`, `OPEN`, `CLOSED`, and `REVEALED` Questions with zero, one, and multiple Answers. Confirm that Home shows only `OPEN` Questions in deadline order and links to the selected Detail.

**Acceptance Scenarios**:

1. **Given** multiple Questions are accepting Answers, **When** the human opens Home, **Then** only `OPEN` Questions appear in ascending deadline order.
2. **Given** an `OPEN` Question appears on Home, **When** the human inspects it, **Then** the body, answer count, absolute deadline, remaining time, and `Answers are sealed` appear with English labels.
3. **Given** the human selects a listed Question, **When** they follow its Detail action, **Then** the selected Question Detail opens.
4. **Given** no `OPEN` Question exists, **When** the human opens Home, **Then** `No open questions right now.` and the existing create-Question or Sign in action appear.
5. **Given** a Question reaches its deadline, **When** Home is reloaded, **Then** the Question disappears and no negative remaining time appears.

---

### User Story 2 - Understand the Sealed State During the Answer Period (Priority: P1)

On Question Detail, a human confirms the body, answer count, deadline, and remaining time and understands that Answers remain sealed until the deadline. A signed-out human sees a Sign in action; an authenticated human without an Answer sees the SPEC 007 Agent request prompt.

**Why this priority**: This establishes the Challenge's central mechanism: a human selects a Question and Personal Agents answer without seeing one another's Answers.

**Independent Test**: Open an `OPEN` Question containing a unique secret in another user's Answer while signed out, as the creator, and as an authenticated unanswered user. Confirm that only public information and the correct next action appear and no other-user Answer data exists in the HTML.

**Acceptance Scenarios**:

1. **Given** an `OPEN` Question with Answers, **When** the human opens Detail, **Then** the body, answer count, absolute deadline, remaining time, `Answers are sealed`, and an explanation of independent answering appear.
2. **Given** a signed-out human views an `OPEN` Question, **When** they inspect how to participate, **Then** `Sign in to answer with your personal agent.` and the existing Google Sign in action appear, while the Agent prompt and submission information do not.
3. **Given** an authenticated unanswered human views an `OPEN` Question, **When** Detail opens, **Then** SPEC 007's `Ask your personal agent`, the finalized one-line English prompt specifying ChatGPT's built-in browser rather than an existing Chrome tab and containing the current-origin absolute Question URL without query or fragment, and `Copy prompt` appear.
4. **Given** the creator views their own `OPEN` Question, **When** they inspect Detail, **Then** creator status is visible but grants no pre-Reveal access to other Answers.
5. **Given** a Question is `CLOSED`, **When** Detail opens, **Then** acceptance-ended and still-sealed states appear, without a new Agent prompt or other Answers.
6. **Given** a missing Question or a public URL for a `DRAFT`, **When** a human accesses it, **Then** both return the same `Question unavailable.` result without revealing the Draft.

---

### User Story 3 - Confirm the Change After an Agent Answers (Priority: P1)

After a Personal Agent answers, an authenticated human reloads Question Detail and confirms the increased count, their Agent's completed status, and that their own Answer remains sealed until the deadline. They cannot inspect another user's Answer.

**Why this priority**: This enables the visible “zero to one to multiple Answers, while bodies remain hidden” change required by the three-minute demo.

**Independent Test**: Two users' Personal Agents answer the same Question in sequence. Confirm that each reload updates the count and current-user state correctly while neither human sees the other's Answer.

**Acceptance Scenarios**:

1. **Given** the authenticated human's Personal Agent posted an Answer, **When** Detail is reloaded, **Then** `Your agent has answered.`, `Your answer remains sealed until the deadline.`, and the current user's Answer appear, without a new-answer prompt.
2. **Given** one Personal Agent already answered, **When** another user's Agent answers and the page reloads, **Then** the count becomes two and each user sees only their own Answer.
3. **Given** another user's Answer has identifiable body text or an excerpt, **When** any signed-out, creator, unanswered, or answered human opens `OPEN` or `CLOSED` Detail, **Then** exposure of that Answer's body, excerpt, identifier, author, and individual timestamps is zero.
4. **Given** current-user submission retrieval fails, **When** Detail opens, **Then** show `Your submission status is temporarily unavailable. Try again.` rather than treating it as unanswered, and show neither the Agent prompt nor the Answer.
5. **Given** a Question is `REVEALED`, **When** Detail opens, **Then** preserve SPEC 008's minimal Reveal browsing and show no new-answer prompt. SPEC 010 handles the finished Challenge presentation.

---

### User Story 4 - Audit Operational Actions (Priority: P1)

The administrator can inspect public-app login, logout, Question create/update/publish, and Answer create/update/delete operations with the acting account, target, outcome, and occurrence time.

**Why this priority**: A public environment needs a minimum operational trail for investigating misuse and events after deletion.

**Independent Test**: Perform the operations with two users and confirm one unique audit record per operation without duplicating Question or Answer bodies, authentication information, or cookies.

**Acceptance Scenarios**:

1. **Given** a human logs in or out successfully, **When** the administrator inspects audit records, **Then** the acting account, action type, and time appear.
2. **Given** a human creates, updates, or deletes a Question or Answer, **When** records are inspected, **Then** the actor, target type and ID, action, and time appear.
3. **Given** a Question or Answer contains a secret, **When** audit records are retrieved, **Then** no body, excerpt, cookie, token, or OAuth value is present.

---

### User Story 5 - Enter the Administration Interface as the Sole Administrator (Priority: P1)

The one environment-configured administrator can access the administration interface after ordinary Google Login. Signed-out humans and other authenticated humans cannot access administration information.

**Why this priority**: This authorization boundary is required by every subsequent administration feature.

**Independent Test**: Directly access administration pages and operations while signed out, as a regular account, and as the configured administrator; only the administrator succeeds.

**Acceptance Scenarios**:

1. The signed-in configured administrator can open the administration interface.
2. A signed-out request receives the same response as an ordinary 404, with no login guidance, administration disclosure, or data.
3. A non-administrator authenticated request receives the same ordinary 404 without disclosure.
4. Missing or invalid administrator configuration grants authority to nobody and returns the ordinary 404.
5. Public pages contain no administration link, and former path `/admin` returns 404 without redirecting.

---

### User Story 6 - List Public Data (Priority: P1)

The administrator can list Users, Questions, Answers, and audit records to identify problematic targets.

**Why this priority**: The target, owner, content, state, and time must be checked before deletion or banning.

**Independent Test**: Prepare multiple records and confirm that only the administrator can inspect the required fields in newest-first order.

**Acceptance Scenarios**:

1. The User list shows user ID, display name, email, ban state, and creation time.
2. The Question and Answer lists show content, owner, state, creation/update times, and target identifiers.
3. The audit list shows actor, action, target, outcome, and occurrence time in newest-first order.

---

### User Story 7 - Delete an Inappropriate Question (Priority: P1)

The administrator can delete, but not edit, an inappropriate Question. Its Answers are deleted with it while the deletion audit record remains.

**Why this priority**: A public service must promptly remove inappropriate Questions and associated public information.

**Independent Test**: Delete a Question with Answers and confirm that it and its children disappear from public pages, APIs, and administration lists while only the administrator deletion record remains.

**Acceptance Scenarios**:

1. Deleting an existing Question deletes its Answers and the interface explains that the action cannot be undone.
2. Deleting a missing target changes no other Question and reports it as missing.
3. A direct deletion request from a regular user is rejected without changing the Question.

---

### User Story 8 - Delete an Inappropriate Answer (Priority: P1)

The administrator can delete, but not edit, only an inappropriate Answer. The Question and other Answers remain, and the audit record is retained.

**Why this priority**: This handles one inappropriate public Answer without losing the entire Question.

**Independent Test**: Delete one of multiple Answers to a Question and confirm only that Answer disappears.

**Acceptance Scenarios**:

1. Deleting one Answer removes only that Answer and updates the count.
2. Deleting a missing Answer changes no other Answer and reports it as missing.
3. A direct deletion request from a regular user is rejected without changing the Answer.

---

### User Story 9 - Ban a User (Priority: P1)

The administrator can ban a problematic regular user, invalidate existing sessions, and stop new login and authenticated operations. The ban can be removed to recover from mistakes.

**Why this priority**: Persistent abuse must be stoppable at the account level, not only by deleting individual content.

**Independent Test**: Ban a regular user and confirm existing and new sessions are unavailable, login works after unbanning, and the administrator cannot ban themselves.

**Acceptance Scenarios**:

1. Banning a signed-in regular user marks them banned, invalidates all sessions, and rejects later authenticated operations.
2. Google Login by a banned user creates no new session.
3. Removing a ban allows the user's next login.
4. An attempt by the administrator to ban themselves is rejected and administration access remains.

### Edge Cases

- Immediately before, exactly at, and after the deadline, server-side Question state is authoritative; no new Agent prompt or negative remaining time appears at or after the deadline.
- Render `0 answers`, `1 answer`, and `n answers` correctly without implying vote totals or representative public opinion.
- Keep application UI in English even when a Question is Japanese; never translate the Question body.
- Treat HTML, scripts, and long strings in Question bodies and the current user's Answer as text, never executable structure.
- A public-data failure on Home or Detail must show temporary unavailability, not an empty list or zero Answers.
- On authentication or current-user Answer retrieval failure, show neither private information nor the Agent prompt.
- Never reuse a user-specific Detail response for another session or signed-out human.
- Repeated deletion or ban requests must not affect another target, and create a unique audit record only for a committed state change.
- Question deletion removes child Answers but retains audit records.
- A race between banning and session creation must leave no valid session after the ban commits.

## Requirements *(required)*

### Functional Requirements

- **FR-001**: The system MUST show on Home only public Questions classified as `OPEN` using current server time.
- **FR-002**: The system MUST order Home Questions by ascending answer deadline with stable tie-breaking.
- **FR-003**: Each Home Question MUST show its body, answer count, absolute deadline, nonnegative remaining time, `Answers are sealed`, and a Detail action.
- **FR-004**: Home with no Open Questions MUST show `No open questions right now.` and the existing create-Question or Sign in action.
- **FR-005**: Published Question Detail MUST be available to signed-out and authenticated humans and show the body, current state, answer count, absolute deadline, and remaining time.
- **FR-006**: An `OPEN` Question MUST show `Answers are sealed` and an English explanation that Answers stay private until the deadline to preserve independent answering.
- **FR-007**: A signed-out human MUST see the existing Google Sign in action and MUST NOT see the Agent prompt or current-user submission information.
- **FR-008**: Only an authenticated unanswered human viewing an `OPEN` Question MUST see SPEC 007's finalized one-line Agent request prompt, specifying ChatGPT's built-in browser and excluding existing Chrome tabs, containing the current-origin absolute Question URL without query or fragment, along with selectable full text, `Copy prompt`, and copy status. Detailed Agent instructions and safety boundaries MUST come from each WebMCP tool contract, not be duplicated in the prompt. Tool contracts MUST prioritize available user-authored statements and MUST NOT treat assistant suggestions or options under consideration as user facts. When no explicit personal view exists, they MUST create and submit the best proxy answer without asserting unverified personal facts or known beliefs, and MUST NOT ask the human solely due to that absence. The initial prompt grants submission permission, so no additional preview or approval is required.
- **FR-009**: An authenticated answered human MUST see `Your agent has answered.`, `Your answer remains sealed until the deadline.`, and their own Answer, and MUST NOT see a new-answer prompt.
- **FR-010**: The system MUST NOT confuse Question creator status with current-user submission state or pre-Reveal Answer access.
- **FR-011**: A `CLOSED` Question MUST show acceptance ended and still sealed, without a new Agent prompt or another user's Answer.
- **FR-012**: A `REVEALED` Question MUST preserve SPEC 008 browsing and access control and MUST NOT show a new Agent prompt.
- **FR-013**: Question Detail MUST show the latest aggregate answer count on reload so humans can observe changes from zero to multiple.
- **FR-014**: In `OPEN` and `CLOSED`, the system MUST NOT include another user's Answer body, excerpt, ID, author, or individual timestamps in HTML text, attributes, embedded data, or errors.
- **FR-015**: A missing Question and a `DRAFT` requested through its public URL MUST produce the same unavailable result.
- **FR-016**: Current-user submission state MUST be derived only from a valid session; if unavailable, it MUST NOT be converted to unanswered, and private information and the Agent prompt MUST remain hidden.
- **FR-017**: Application UI MUST be English, while Question bodies and the current user's Answer MUST remain untrusted text in their stored language.
- **FR-018**: The system MUST NOT reuse user-specific Question Detail content for another session.
- **FR-019**: Automated regression tests MUST cover the Home list, Question Detail viewer states, deadline boundaries, answer counts, and non-exposure of pre-Reveal secrets.
- **FR-020**: Completion of this SPEC MUST NOT depend on a dedicated Login screen, advanced post-login return destinations, My Questions redesign, finished Reveal presentation, Challenge visual design, or a comprehensive accessibility audit.
- **FR-021**: The system MUST persist audit records for successful login, logout, Question create/update/publish, Answer create/update/delete, administrator deletion, ban, and unban.
- **FR-022**: Audit records MUST contain a unique ID, actor user ID, action, target type, target ID, successful outcome, and server occurrence time, and MUST NOT contain Question bodies, Answer bodies, excerpts, cookies, tokens, or OAuth values.
- **FR-023**: Only one authenticated User whose email exactly matches the environment configuration MUST be treated as administrator; invalid configuration MUST grant no authority.
- **FR-024**: Administration requests by signed-out users, regular Users, with invalid configuration, or during authorization failure MUST return the same response as an ordinary 404 and MUST disclose no administration interface, link, or target information.
- **FR-024a**: The administration interface MUST exist only at `/club-operations`, MUST NOT be linked from public screens, MUST return 404 for former path `/admin` without redirecting, and MUST set `noindex, nofollow`.
- **FR-025**: The administrator MUST be able to inspect user ID, display name, email, ban state, and creation time in the User list.
- **FR-026**: The administrator MUST be able to inspect each Question's ID, body, creator, state, and create/update times, and each Answer's ID, body, excerpt, author, Question ID, and create/update times.
- **FR-027**: The administrator MUST be able to inspect audit records in newest-first order.
- **FR-027a**: The administration landing page MUST show counts and dedicated list links for Users, Questions, Answers, and Audit Logs, and MUST NOT show individual records. All four dedicated lists MUST use tables and paginate at 20 records per page.
- **FR-028**: The administrator MUST be able to delete but not edit a Question, and deletion MUST remove its Answers.
- **FR-029**: The administrator MUST be able to delete but not edit an individual Answer without changing the Question or other Answers.
- **FR-030**: The administrator MUST be able to ban and unban regular Users and MUST NOT ban themselves.
- **FR-031**: When a ban commits, the system MUST invalidate every existing session for the target User and reject new session creation while banned.
- **FR-032**: Administration pages and operations MUST NOT be stored in shared per-user caches and MUST apply identical authorization on every path, including direct URLs and form resubmission.
- **FR-033**: Administrator deletion, ban, and unban MUST be executed only from a confirmed same-origin form naming the target, and success MUST redirect to the dedicated list for that target type.

### Key Entities

- **Open Question List Item**: Question body, answer count, deadline, remaining time, sealed state, and Detail action discoverable from Home.
- **Question Viewer State**: Mutually exclusive presentation decision combining Question state, authentication state, creator match, and current-user submission state.
- **Current User Submission**: Unsubmitted, submitted, or unavailable. Show the current user's Answer only when submitted.
- **Display Deadline**: Absolute deadline and nonnegative remaining time derived from the same server-time snapshot.
- **Administrator Configuration**: One environment-configured administrator email; authority is granted only by exact match with the authenticated User's email.
- **Ban**: Suspension state containing user ID, acting administrator, reason, and ban time; deletion removes the ban.
- **Audit Record**: Append-only operational trail containing actor, action, target, outcome, and occurrence time, without duplicated input bodies or authentication secrets.

## Success Criteria *(required)*

### Measurable Outcomes

- **SC-001**: With validation data covering four Question states, 100% of Questions shown on Home are `OPEN`, and all eligible `OPEN` Questions appear in deadline order.
- **SC-002**: For signed-out, creator, authenticated-unanswered, and authenticated-answered states, Question, count, deadline, sealed state, and next action match expectations in 100% of cases.
- **SC-003**: When two Personal Agents answer sequentially, reloaded counts change correctly through zero, one, and two, and each human sees only their own Answer.
- **SC-004**: Across all `OPEN` and `CLOSED` subjects, exposure of secret values from other Answers in HTML text, attributes, embedded data, and errors is zero.
- **SC-005**: Immediately before, exactly at, and after the deadline, Question state, remaining time, and new Agent prompt visibility agree 100% with server classification, and negative remaining time occurs zero times.
- **SC-006**: Within two minutes of opening Home, a human can select an Open Question, understand sealing and the deadline, and reach the Prompt to give their Personal Agent.
- **SC-007**: Automated regression tests for existing Question creation, Google authentication, five WebMCP tools, Answer update/delete, and minimal Reveal browsing succeed 100%.
- **SC-008**: Across all validation cases for login, logout, Question, Answer, and administrator operations, 100% create audit records with actor and target and zero contain secret values.
- **SC-009**: Across all administration-page and operation cases for signed-out and regular users, successful accesses, administration-disclosing text or links, and exposed administration information are all zero.
- **SC-010**: The administrator can identify a target User, Question, Answer, or audit record within two minutes.
- **SC-011**: In every administrator Question/Answer deletion case, only the intended target is removed and unintended data changes are zero.
- **SC-012**: No existing or new session of a banned User remains usable, and login succeeds after unbanning.

## Assumptions

- Reuse SPEC 005 Question-state decisions, SPEC 006 Question creation and My Questions, SPEC 007 Agent prompts and five tools, and SPEC 008 Answer access control and minimal Reveal browsing.
- Home and published Question Detail are available to signed-out humans so they can understand the Challenge before deciding to sign in.
- Show answer counts, but not Answer contents, in human-facing screens; do not add counts to WebMCP.
- A Question creator may answer their Question but receives no creator-based pre-Reveal browsing privilege.
- Questions may use any language. There is no primary-language input, display, or API metadata; the Personal Agent infers answer language from the body.
- This SPEC completes Challenge Core functionality today. SPEC 010 completes visual design, presentation polish, and post-Reveal comparison.
- Conduct the Core Demo manual test after SPEC 010 screen implementation is complete.
- Audit records track operations and actors; they are not content copies or restoration storage.
- The administrator uses existing Google Login; add no dedicated password or authentication method.

## Dependencies

- SPEC 005, “Domain Data Model and Question Lifecycle”
- SPEC 006, “Question Creation and Publication Flow”
- SPEC 007, “WebMCP MVP Tool Set”
- SPEC 008, “Access Control for Sealed Answers”

## Out of Scope

- Challenge visual direction, typography, color, layout, motion, and finished responsive presentation (SPEC 010)
- Finished human UI communicating post-Reveal Answer lists and comparison (SPEC 010)
- Dedicated Login page, advanced return to the pre-login page, or complete authentication-navigation redesign
- Redesign of My Questions and the Question administration screen
- New accessibility test dependencies such as `axe-core`, VoiceOver, 200% zoom, and exhaustive JavaScript-disabled verification
- Question search, recommendations, pagination, and `My Answers`
- Voting, ranking, Best Answer, Winner, Consensus, and AI Summary
- Additional submission documents, comprehensive cross-browser verification, and nonessential hardening (SPEC 011)
- Multiple administrators, role management, delegated authority, restoration of deleted bodies, or editing, deleting, or externally forwarding audit records
