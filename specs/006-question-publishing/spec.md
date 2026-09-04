# Feature Specification: Question Creation and Publication Flow

**Feature Branch**: `006-question-publishing`

**Created**: 2026-09-02

**Status**: Draft

**Input**: "Implement SPEC 006 — Question Creation and Publication Flow from MILESTONE.md"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Create a Question as a Draft (Priority: P1)

An authenticated Human enters a Question body and answer deadline and saves it as an unpublished draft. When input contains errors, the Human can understand which fields need correction and fix them without losing valid entered content.

**Why this priority**: Without safely creating a valid Question, later value from publication, Agent answers, and Reveal cannot exist.

**Independent Test**: An authenticated Human enters the three valid fields plus the public-content acknowledgment, saves, and can redisplay the same content as their own draft.

**Acceptance Scenarios**:

1. **Given** an authenticated Human has opened the creation screen, **When** they enter a Question body of 10–1,000 characters, an answer deadline between one hour and thirty days from now, acknowledge the public content, and save, **Then** exactly one Question is saved as their `DRAFT` and is not shown as a public Question.
2. **Given** an authenticated Human has entered valid values, **When** they make the body, deadline, or public-content acknowledgment invalid and save, **Then** nothing is saved, an English error appears near each affected field, and valid input values remain.
3. **Given** an unauthenticated User accesses Question creation, **When** they try to display or save the form, **Then** no Question is created and English guidance explains that sign-in is required.

---

### User Story 2 - Review and Publish a Draft (Priority: P1)

The Question creator reviews and corrects the body and answer deadline of their own draft and explicitly confirms publication. After publication, Personal Agents can treat it as answerable, and the meaning of the Question and answer conditions cannot change later.

**Why this priority**: Publication is the irreversible boundary that makes a Question answerable, so the creator's intent must match the conditions seen by respondents.

**Independent Test**: Edit and publish the owner's draft, confirm its publication time is fixed and it becomes `OPEN`, and verify republishing and post-publication editing are rejected.

**Acceptance Scenarios**:

1. **Given** the owner has a valid draft with at least one hour before its deadline, **When** they review it and select `Publish question`, **Then** it is published exactly once through the review screen and is `OPEN` from publication.
2. **Given** the owner has a draft, **When** they change the body or deadline to another valid value before publication and save, **Then** the same draft is updated and the changes appear in pre-publication Review.
3. **Given** a Question is published, **When** its creator attempts to change the body or deadline or publish again, **Then** existing content and publication time do not change and English copy explains that the operation is unavailable because it is already published.
4. **Given** enough time passes after saving a draft that less than one hour remains, **When** the creator publishes it, **Then** publication is rejected and English guidance asks for a new valid deadline.

---

### User Story 3 - Manage Personal Questions in My Questions (Priority: P2)

An authenticated Human uses `My Questions` to see their Questions newest first and understand state, deadline, and answer count. Drafts link to editing or publication, while published Questions link to details.

**Why this priority**: Without rediscovering created Questions, completing drafts, checking publication, and tracking answer activity becomes difficult.

**Independent Test**: Prepare a Question in every state for one User and confirm the list shows only that User's Questions newest first with only the actions allowed for each state.

**Acceptance Scenarios**:

1. **Given** an authenticated Human created multiple Questions, **When** they open `My Questions`, **Then** only their Questions appear newest first, and each item shows the beginning of the body, state, answer deadline, and answer count.
2. **Given** the list contains `DRAFT` and published Questions, **When** the Human reviews each item, **Then** `DRAFT` shows `Edit` and `Review and publish`, while published Questions show only `View question`.
3. **Given** the Human has not created a Question, **When** they open `My Questions`, **Then** `You haven't created any questions yet.` and a `Create a question` link appear.

---

### User Story 4 - Reject Unauthorized Viewing and Changes (Priority: P2)

A User cannot view the existence or content of another User's draft, nor edit or publish another User's Question. An unauthorized attempt returns no information that reveals whether the target exists.

**Why this priority**: Leaking unpublished drafts or publication by a non-owner would damage trust and content integrity.

**Independent Test**: With two authenticated Humans, directly access management operations for the other User's draft and published Question and confirm no content can be retrieved, changed, or published.

**Acceptance Scenarios**:

1. **Given** another User owns a draft, **When** an authenticated Human attempts to view, edit, or publish it by identifier, **Then** a common English error reveals neither existence nor content and data remains unchanged.
2. **Given** another User owns a published Question, **When** an authenticated Human attempts a management change or publication, **Then** the operation is rejected and the Question body, deadline, and publication time remain unchanged.
3. **Given** creation, editing, or publication is requested through a Personal Agent path, **When** any management operation is attempted, **Then** the Question remains unchanged and an English error states that this is a Human-facing feature.

### Edge Cases

- Evaluate body length after trimming surrounding whitespace, count newlines as one character, and consistently enforce display-character boundaries for emoji and combining characters.
- A whitespace-only body, 9 or fewer characters, or 1,001 or more characters cannot be saved or published.
- Questions may use any language; creators are not asked to specify a primary language. The Personal Agent infers answer language from the body.
- A deadline exactly one hour or thirty days after service time is valid; closer, later, or uninterpretable values are rejected.
- Even if the User device time or time zone is wrong, service time determines whether save and publication are allowed. The screen shows the selected local time and time zone and corresponding absolute time.
- Duplicate or concurrent publication submissions establish one publication time and never duplicate the Question.
- If another operation publishes a draft while it is being edited, a late edit never overwrites published content.
- If a deadline becomes invalid after Review opens, publication revalidates at execution rather than trusting stale Review data.
- A temporary save/publication failure is not presented as success; show a retryable English error. If publication outcome is uncertain, recheck the latest state to prevent duplicate publication.
- `My Questions` shows only answer counts before and after Reveal, never Answer bodies or another User's identifying information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide Question creation, draft save, draft edit, publication review, publication confirmation, and `My Questions` only to authenticated Humans.
- **FR-002**: The system MUST require a body, answer deadline, and acknowledgment that public content contains no confidential or personal information.
- **FR-003**: The system MUST restrict Question bodies to 10–1,000 characters after trimming, and MUST NOT save whitespace-only, control-only, or out-of-range bodies.
- **FR-004**: The system MUST NOT restrict Questions to a specific language or require creators to choose a primary language.
- **FR-005**: The system MUST NOT treat Question language as user input, display data, or WebMCP metadata, and MUST allow Personal Agents to infer answer language from the Question body.
- **FR-006**: The system MUST restrict answer deadlines to the future from one hour through thirty days after service time at creation or update and MUST revalidate the same condition at publication.
- **FR-007**: The system MUST store the answer deadline as an absolute time and show the correspondence among the selected local date/time, time zone, and absolute time on input and review screens.
- **FR-008**: In the MVP, the system MUST set reveal start equal to the answer deadline and MUST NOT let creators enter or change a separate reveal time.
- **FR-009**: The system MUST save valid input as an owner-associated `DRAFT` and MUST NOT set publication time when saving a draft.
- **FR-010**: The system MUST allow body, answer deadline, and public-content acknowledgment updates only for an owner-associated `DRAFT`.
- **FR-011**: Before publication, the system MUST provide a review screen showing the body, answer deadline, post-publication immutability, and that Answers remain sealed until the deadline.
- **FR-012**: The system MUST set publication time to service time exactly once and make a valid Question `OPEN` only when the owner explicitly selects `Publish question` from Review.
- **FR-013**: The system MUST confirm publication at most once and MUST NOT duplicate a Question under double submission, retry, or concurrency.
- **FR-014**: The system MUST prevent changes to a published Question's body, answer deadline, reveal time, or creator through either screens or direct management operations.
- **FR-015**: `My Questions` MUST show only the current User's Questions newest first, including the beginning of the body, current state, answer deadline, and answer count.
- **FR-016**: `My Questions` MUST show edit and publication-review paths for `DRAFT`, detail-view paths for published Questions, and MUST NOT show management actions inappropriate to state.
- **FR-017**: When the current User owns no Questions, the system MUST show an English empty-state message and a path to creation.
- **FR-018**: The system MUST distinguish unauthenticated, wrong-owner, nonexistent Question, invalid input, invalid state, deadline violation, and temporary failure, and explain the User's next action in English.
- **FR-019**: For viewing, editing, or publishing another User's draft, the system MUST return the same external outcome as for a nonexistent Question and MUST NOT disclose body or other draft information.
- **FR-020**: At commit time, the system MUST verify ownership and the Question's latest state so conflicting edit/publication operations cannot overwrite published content.
- **FR-021**: The system MUST associate English input errors with affected fields and preserve valid, non-secret input values after an error.
- **FR-022**: The system MUST treat Question bodies as untrusted user-generated content and MUST NOT interpret them as instructions, markup, or executable content when displayed.
- **FR-023**: As the initial moderation policy, the system MUST perform neither editorial review nor automatic semantic decisions before publication, and MUST ask the creator to acknowledge that the Question becomes public and contains no personal, confidential, or harmful third-party content.
- **FR-024**: This specification MUST NOT provide reporting, administrator review, Question deletion, automatic translation, or application-side language detection.
- **FR-025**: Question creation/publication MUST NOT return another User's Answer body, excerpt, or submitter identifier; `My Questions` handles only aggregate answer counts.

### Key Entities

- **Question**: A prompt created by an authenticated Human. It has creator, body, publication time, answer deadline, reveal time, creation and update times; current state follows publication presence and time boundaries.
- **Question Draft Input**: Body, local answer deadline and time zone, and public-content acknowledgment supplied by a Human for draft creation/editing. Every rule must pass before it becomes a Question.
- **Question Ownership**: The immutable relationship between Question and creator User that controls draft viewing, editing, publication, and inclusion in `My Questions`.
- **Publication Confirmation**: The creator's explicit act after reviewing content, irreversibility, and the sealed period. It is the boundary that sets publication time exactly once.
- **My Questions Item**: A management summary containing the beginning of the body, current state, answer deadline, answer count, and state-appropriate actions, but no Answer content or submitter information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time Users can save a valid Question draft and publish it from Review within five minutes while already signed in.
- **SC-002**: At least thirty input cases covering body limits, arbitrary-language bodies, both deadline boundaries, and acknowledgment presence match expected acceptance/rejection 100%.
- **SC-003**: Across at least twenty management operations targeting unauthenticated, wrong-owner, published, or nonexistent Questions, zero unauthorized creations, views, changes, or publications succeed.
- **SC-004**: After ten sequential and ten concurrent publication requests for the same draft, exactly one Question and one publication time exist, with zero content differences.
- **SC-005**: Across at least fifteen `My Questions` cases covering every state, empty state, and multiple Users, zero other-User Questions or Answer contents appear, and state/action matching is 100%.
- **SC-006**: At least 90% of Users receiving invalid input can save a valid draft within two retries using only the displayed English field errors.
- **SC-007**: Every verification participant reviewing before publication can correctly explain the body, answer deadline, post-publication immutability, and sealed-until-deadline behavior before publishing.
- **SC-008**: A keyboard-only User can create, identify field errors, review, publish, and return to `My Questions` within ten minutes, with zero inoperable required controls.

## Assumptions

- Continue using the authenticated Google OAuth User and Human browser Session established in SPEC 002 as the source of Question creator identity.
- Reuse without modification the Question schema, repository boundary, `DRAFT → OPEN → CLOSED → REVEALED` state evaluation, service time, and one-way publication established in SPEC 005.
- Questions may use any language, and Personal Agents infer answer language from the body. Optimization for any specific language is not required.
- The User's local time zone may provide the default display, but universal absolute time governs storage and deadline decisions.
- Publication is immediate, not scheduled. Validate a draft's answer deadline both when saving and when publishing.
- The public-content acknowledgment is creator self-attestation for initial moderation, not a substitute for legal judgment, editorial review, or semantic publication decisions.
- Screen copy, button names, field labels, and errors are English; the Question body may use any language.
- `My Questions` is the MVP management list. Search, filters, sort changes, pagination, deletion, and duplication are unnecessary at initial scale.

## Dependencies

- SPEC 002 is complete and provides the authenticated Human Session and User ID.
- The safety policy from SPEC 003 remains usable. Its English/Japanese validation corpus does not limit supported languages.
- SPEC 005 is complete and provides draft persistence, ownership, publication, and state evaluation.

## Out of Scope

- Personal Agent Question-retrieval and Answer-submission tool contracts and flows (SPEC 007)
- Unified Answer access control across every pre-/post-Reveal path (SPEC 008)
- General browsing, including Home and Question Detail, and public Question discovery (SPEC 009)
- Post-Reveal Answer listing and comparison (SPEC 010)
- Question deletion, unpublishing, post-publication editing, duplication, scheduled publication, and collaborative editing
- Automatic translation, application-side language detection, and language-specific input restrictions
- Automated moderation, pre-publication operator review, reporting, appeals, administration, and audit logs
- Voting, ranking, summarization, search, Agent-to-Agent conversation, and Personal Context storage
