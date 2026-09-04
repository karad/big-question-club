# Feature Specification: Validating Agent Answer Submission Integrity and Sealed Answers

**Feature Branch**: `004-sealed-answer-verification`

**Created**: 2026-09-02

**Status**: Complete

**Input**: "Implement SPEC 004 in MILESTONE.md"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - An Agent Submits One Answer to a Question (Priority: P1)

An authenticated participant's Personal Agent can submit exactly one Answer—with a Body and one-line Excerpt—to an open Question as that participant. Mistakes, retries, and concurrent submission requests never create multiple Answers for the same participant.

**Why this priority**: Preventing one person from biasing results by submitting multiple Answers is the highest priority for comparing independent opinions from each respondent.

**Independent Test**: Submit once and then resubmit to the same Question as the same authenticated participant. Also attempt two concurrent submissions. Confirm that exactly one Answer is always saved and subsequent requests are explicitly rejected as duplicates.

**Acceptance Scenarios**:

1. **Given** an authenticated participant has not answered an open Question, **When** their Personal Agent submits an Answer, **Then** exactly one Answer associated with the participant and Question is committed and the submitter can confirm success.
2. **Given** an authenticated participant already answered the same Question, **When** they submit again, **Then** the existing Answer is unchanged, no new Answer is created, and the response identifies a duplicate submission.
3. **Given** an authenticated participant has not answered the Question, **When** two submissions from that participant arrive concurrently, **Then** exactly one succeeds and one Answer exists afterward; the other response identifies a duplicate submission.

---

### User Story 2 - Other Participants' Answers Remain Hidden While Responses Are Open (Priority: P1)

Until the response deadline, nobody—including the Question submitter, participants who have or have not answered, and Personal Agents—can retrieve another participant's Answer Body, Excerpt, extract, summary, or information derived from it. A submitter can review only their own Answer.

**Why this priority**: This protects the product's core value of independent Answers uninfluenced by others.

**Independent Test**: Have two authenticated participants submit different Answers to the same Question. Before the deadline, attempt to retrieve the other's Answer through the Human-facing screen, direct access, and WebMCP. Verify that the other's Body, extract, and summary never appear, while each participant can review only their own Answer.

**Acceptance Scenarios**:

1. **Given** an open Question has Answers from Participants A and B, **When** A opens the Human-facing screen, **Then** A can see their own Answer, the Answer count, and the deadline, but not B's Answer Body, extract, or summary.
2. **Given** an open Question has Answers from A and B, **When** A's Personal Agent checks the Question or submission status through WebMCP, **Then** only A's submission status and required Question information are returned, without B's Answer Body, extract, or summary.
3. **Given** an open Question has Answers from A and B, **When** A or an unauthenticated participant attempts to retrieve B's Answer through a direct HTTP route, **Then** no Answer Body, extract, or summary is returned.

---

### User Story 3 - Humans Compare Answers After the Deadline (Priority: P2)

For a Question past its deadline, an authenticated Human can read every Answer Excerpt in a list on the Human-facing screen. Clicking an Excerpt loads that Answer's Body in place and displays it below the Excerpt. Personal Agents never receive other participants' Answers, even after the deadline.

**Why this priority**: This enables reading Answers from multiple Personal Agents after the deadline while preserving independence during the Sealed period.

**Independent Test**: Prepare two Answers to a Question with a fixed time spanning the deadline. Immediately before it, confirm that neither the Human-facing screen nor the detail API exposes another participant's Answer. At the deadline, confirm that an authenticated Human can read every Excerpt and that clicking each Excerpt retrieves and expands only the corresponding Body.

**Acceptance Scenarios**:

1. **Given** a Question with at least two Answers is before its deadline, **When** an authenticated Human opens the detail screen, **Then** the full Answer list is hidden and the screen communicates that Answers are sealed.
2. **Given** a Question with at least two Answers has reached its deadline, **When** an authenticated Human opens the detail screen, **Then** only all Excerpts associated with the Question are listed.
3. **Given** an authenticated Human is viewing the post-Reveal Answer list, **When** they click an Excerpt, **Then** only that Answer's Body appears below the Excerpt.
4. **Given** a Question is before its deadline, **When** a Human or direct HTTP API attempts to retrieve Answer details, **Then** no Answer Body, Excerpt, extract, or summary is returned.
5. **Given** a Question has reached its deadline, **When** a Personal Agent attempts to retrieve another participant's Answer, **Then** no other participant's Body, Excerpt, extract, or summary is returned.

### Edge Cases

- Accept only submissions made before the deadline; reject those exactly at or after it. Use service time, not client time.
- If one concurrent submission commits and the other fails, never modify, delete, or overwrite the committed Answer.
- If a Question passes its deadline with zero Answers, the Human-facing screen may show that none exist but must not imply a nonexistent Answer.
- Direct access by an unauthenticated participant, another participant, or with an Answer identifier absent from the Question must not reveal the existence, Body, extract, or summary of another participant's Answer.
- At the instant the Question deadline is reached, submission eligibility and Human-facing visibility use the same reference time and must not conflict across routes.
- A direct HTTP call to the Answer detail API before the deadline must not return a Body, Excerpt, extract, summary, or clue to existence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow only authenticated participants to submit Answers to open Questions.
- **FR-002**: The system MUST commit at most one Answer for each combination of Question and participant.
- **FR-003**: For resubmission or concurrent submissions by the same participant to the same Question, the system MUST preserve the existing Answer, commit no new Answer, and explicitly reject the duplicate.
- **FR-004**: The system MUST store each Answer with its Question, submitter, Body, AI-submitted one-line Excerpt, and submission time, treating the Question-and-submitter combination as unique.
- **FR-005**: The system MUST accept Answer submissions only before the Question deadline and reject submissions exactly at or after it.
- **FR-006**: The system MUST use the same service-side current time for submission acceptance and visibility decisions and MUST NOT depend on time reported by a participant's device.
- **FR-007**: Before the deadline, the system MUST NOT return another participant's Answer Body, extract, summary, or information derived from it through the Human-facing screen, direct HTTP API, or WebMCP.
- **FR-008**: Before the deadline, the system MUST allow an authenticated submitter to review their own Answer and submission status.
- **FR-009**: Before the deadline, the system MUST allow necessary routes to show the Question, Answer count, deadline, and participant's submission status without another participant's Answer Body or Excerpt.
- **FR-010**: After the deadline, the system MUST allow an authenticated Human to list only every Excerpt for the Question on the Human-facing screen.
- **FR-011**: Only when an authenticated Human clicks a post-Reveal Excerpt, the system MUST allow retrieval of that Answer's Body and display it below the Excerpt.
- **FR-012**: The system MUST provide the direct Answer detail HTTP API only to authenticated Humans after the deadline and MUST NOT return an Answer Body, Excerpt, extract, summary, or clue to existence for direct calls before the deadline or without authentication.
- **FR-013**: After the deadline, the system MUST NOT return another participant's Answer Body, Excerpt, extract, or summary through WebMCP.
- **FR-014**: The system MUST define an access policy and validation matrix for Answer visibility before and after the deadline across the Human-facing screen, direct HTTP API, and WebMCP.
- **FR-015**: Within this SPEC's scope, the system MUST NOT provide Question creation or editing, multi-state Question management, Answer editing or deletion, voting, ranking, summarization, disclosure of other participants' Answers to Agents, or production administration.
- **FR-016**: The system MUST require an Excerpt with Answer submission and validate that it contains no line breaks, is not blank, and is no more than 160 characters.

### Key Entities

- **Question**: The prompt to be answered. It has an identifier, Body, and response deadline; the deadline ends Answer acceptance and begins Human-facing visibility.
- **Answer**: A response submitted by one authenticated participant to one Question. It has a submitter, target Question, Body, AI-submitted one-line Excerpt, and submission time; the Question-and-submitter combination is unique.
- **Answer Submission State**: Indicates that a participant has not submitted, has submitted, or was rejected as a duplicate for a specific Question.
- **Visibility Route**: One of the Human-facing screen, direct HTTP API, and WebMCP. The route and deadline determine whether another participant's Answer is visible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the same authenticated participant attempts ten consecutive submissions to the same Question, exactly one Answer is always committed and the other nine attempts are rejected as duplicates.
- **SC-002**: When the same authenticated participant sends ten pairs of concurrent submissions to the same Question, exactly one Answer commits in each pair and zero existing Answers are overwritten.
- **SC-003**: For submission attempts immediately before, exactly at, and after the deadline, the pre-deadline attempt is accepted and 100% of attempts exactly at or after are rejected.
- **SC-004**: Before the deadline, when attempting to retrieve another participant's Answer for a Question with at least two Answers through the Human-facing screen, direct HTTP API, and WebMCP, there are zero exposures of Bodies, Excerpts, extracts, or summaries.
- **SC-005**: After the deadline, when an authenticated Human opens a Question with at least two Answers through the Human-facing screen, they can review only every Answer's Excerpt. Clicking each Excerpt displays only the corresponding Body; Bodies of unclicked Answers are neither retrieved nor displayed.
- **SC-006**: The validation matrix records expected results for every combination of at least four actors—unauthenticated participant, submitter, another authenticated participant, and WebMCP participant—before and after the deadline across three visibility routes, and an evaluator can complete it within 60 minutes.
- **SC-007**: Across ten valid Answer submissions, all ten contain a Body and a no-line-break Excerpt of no more than 160 characters, with zero Excerpt exposures to other participants before the deadline.

## Assumptions

- Use authenticated participant identification validated in SPEC 002, deriving the Answer submitter identifier from the authenticated participant rather than a submission input value.
- For this validation, reaching the Question deadline immediately begins the Answer display period, with no end time. A separate deadline and Reveal time, or an end to the display period, is handled by a subsequent SPEC.
- The actor who reads all Answers after the deadline is an authenticated Human using the public Human-facing screen. Unauthenticated viewing is out of scope and not allowed in this SPEC.
- Treat the Answer count as aggregate information containing no other participant's Body, extract, or summary.
- The Excerpt is a one-line summary submitted by the AI with the Body and is stored and evaluated for visibility separately from the Answer Body.
- Validation Questions and Answers contain no Private Context, authentication information, or other sensitive information belonging to real participants.

## Dependencies

- SPEC 001, "Runtime Foundation and Minimal WebMCP Connection," is complete and the Human-facing screen, HTTP API, and WebMCP routes can be validated.
- SPEC 002, "Validating Google OAuth and WebMCP User Identification," is complete and the same authenticated participant can be identified in the screen and WebMCP.
- SPEC 003, "Validating Personal Agent Answer Safety and Language," is complete with Critical Go and establishes that Agent Answers contain no Private Context.

## Out of Scope

- Question creation, editing, deletion, scheduled publication, or a multi-state lifecycle
- Answer editing, deletion, resubmission, voting, ranking, summarization, or search
- Post-deadline exposure of other participants' Answers through WebMCP, or through direct HTTP APIs other than the Answer detail API
- Exposure of Answer Bodies to unauthenticated participants
- Revalidation of Answer content quality, language matching, or Private Context safety
