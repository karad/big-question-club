# Feature Specification: Answer Reveal Experience and Challenge Visual Design

**Feature Branch**: `010-reveal-visual-design`

**Created**: 2026-09-03

**Status**: Complete

**Input**: “Implement SPEC 010 from MILESTONE.md, prioritize the added requirements, and complete post-Reveal Answer comparison, Home and Question Detail visual design, and list and Question-management improvements.”

## User Scenarios and Tests *(required)*

### User Story 1 - Compare Revealed Independent Answers (Priority: P1)

An authenticated user immediately understands that sealing has ended and compares excerpts and bodies from at least two Personal Agents without respondent identity or ranking bias.

**Why this priority**: Independently produced Answers becoming comparable after the deadline are the Challenge's central value.

**Independent Test**: Open a `REVEALED` Question containing at least two different Answers, verify revealed state, stable order, excerpts, body expansion, and empty state, and confirm existing non-exposure for signed-out users and WebMCP.

**Acceptance Scenarios**:

1. A `REVEALED` Question with at least two Answers clearly shows the sealed-to-revealed change, total count, and ordered excerpts.
2. Selecting one Answer fetches and expands only its body; unselected bodies are neither prefetched nor embedded.
3. Selecting another Answer leaves the first open for vertical comparison.
4. Reloads preserve initial-submission ascending order, ID tie-breaking, and numbering from `Answer 1`.
5. Zero Answers shows `No answers were submitted.` and no invented content.
6. Signed-out users and Personal Agents receive only the human Sign in action or existing safe rejection, with no other Answer excerpt, body, ID, respondent, or time.
7. Results begin with `All answers were submitted by signed-in participants. One answer per account.` and each item shows a per-Question anonymous icon and `Authenticated participant`.
8. Google names/images, user IDs, and raw hashes are hidden; icons cannot track a respondent across Questions, while administration retains account linkage.
9. Only the current user's Answer shows green `Your answer`, with no user ID emitted for that decision.

### User Story 2 - Find Answerable Questions and Results from Home (Priority: P1)

Home lets users find Questions they can answer and Questions whose Results they can read, reach complete lists, and disclose/copy an Agent prompt only when needed.

**Why this priority**: Both primary actions must be obvious to first-time users and during the three-minute demo.

**Independent Test**: With at least six `OPEN` and eleven `REVEALED` Questions, verify limits, order, full-list links, prompt disclosure/copy, and global date display toggling.

**Acceptance Scenarios**:

1. Home shows at most five deadline-ordered `Open questions` and ten newest-first `Results`, with English full-list links.
2. Each Open item shows count and remaining time in one icon-supported line below the body.
3. Activating any time control toggles every displayed Question between remaining and absolute time.
4. Only authenticated unanswered users can disclose the one-line prompt and `Copy prompt`, independently per Question.
5. Copy uses the correct absolute URL and announces success or failure locally.
6. Signed-out or answered users see no inappropriate prompt and receive the correct English next action.
7. Open Cards navigate only through `View question`; Card surface and Agent actions do not navigate.
8. Without an explicit personal view, the Agent creates and submits the best proxy answer from available context without asserting unknown facts or asking solely because the view is absent.
9. The prompt explicitly requires ChatGPT's built-in browser, not an existing Chrome tab.
10. Only confirmed answered Cards/Detail show green `Answered`; unanswered, signed-out, or indeterminate states show no answer-state tag.

### User Story 3 - Browse Question Lists by Page (Priority: P1)

Users browse Open Questions or Results 20 at a time with clear current position and navigation.

**Why this priority**: Content beyond Home limits must remain discoverable as usage grows.

**Independent Test**: With 21+ items per state, verify the 20-item limit, stable order, previous/next navigation, invalid pages, and time toggling.

**Acceptance Scenarios**:

1. Page 1 shows at most 20 items, current page, and available next navigation.
2. Page 2 shows a nonoverlapping next set and available previous/next navigation.
3. Reload preserves deterministic deadline/reveal-time and ID order.
4. Invalid or missing pages produce a safe empty state or valid-page action, never an internal error.
5. Open-list time toggling changes every item on the current page together.

### User Story 4 - Save Draft, Publish Immediately, and Delete a Question (Priority: P1)

An authenticated user uses a next-midnight deadline default, chooses `Save as draft` or `Publish question`, and deletes owned Questions after confirmation without duplicate mutations.

**Why this priority**: These MILESTONE-prioritized improvements prevent mistakes and duplicate demo data.

**Independent Test**: Across times and zones, verify default deadlines, both creation intents, repeated actions, owner deletion, and non-owner rejection.

**Acceptance Scenarios**:

1. New Question defaults to the first editable local `00:00` at least one hour away.
2. `Save as draft` stores exactly one `DRAFT`.
3. `Publish question` creates exactly one reachable `OPEN` Question without draft confirmation.
4. During processing, repeat actions are disabled and double clicks create no duplicate.
5. My Questions Cards show body, state, and count; deletion disclosure shows only the English irreversible checkbox and delete button and requires confirmation.
6. Non-owner or unconfirmed deletion changes nothing and reveals no unnecessary internal information.
7. Confirmed owner deletion makes the Question and Answers unreachable and records a body-free audit event.

### User Story 5 - Understand State Through Consistent Visual Design (Priority: P1)

Across Home, lists, Detail, management, sealed state, and Results, users recognize one product and infer current state and next action from type, color, spacing, icons, and motion.

**Why this priority**: Challenge judging requires the sealed-to-revealed story to be understood quickly, not merely implemented.

**Independent Test**: Inspect primary screens at desktop/mobile widths, with keyboard and reduced motion, across default, hover, focus, loading, empty, and error states.

**Acceptance Scenarios**:

1. Typography, palette, layout, corners, borders, and shadows remain consistent.
2. `OPEN`/`CLOSED` use lock imagery, state color, accessible `Answers are sealed`, and supporting text.
3. `REVEALED` changes to reveal color/icon and brief nonblocking motion.
4. Public screens show neither `Signed in as ...` nor raw user IDs.
5. At 320 px or zoomed, primary content/actions remain reachable without horizontal scrolling.
6. Keyboard and assistive technology perceive controls, focus, state changes, and errors.
7. Reduced motion removes decorative transitions without losing meaning.

### User Story 6 - Communicate the Core Experience in a Three-Minute Demo (Priority: P1)

The demo proceeds from Home through Agent requests, counts zero/one/two, sealing, Reveal, and comparison of two different Answers within three minutes.

**Why this priority**: Showing product differentiation and safety as one flow within judging time is a completion criterion.

**Independent Test**: Time the defined flow with two prepared users and one Question, confirming every state is visually distinct in English.

**Acceptance Scenarios**:

1. Copying the prompt and reflecting two Answers changes the count zero-to-one-to-two without showing other bodies.
2. At reveal time, the demo shows sealing-to-Results and differences between Answers within three minutes.
3. Automated/manual checks confirm WebMCP cannot retrieve other Answers and only authorized human Results can.

### Boundary Conditions

- If tomorrow's midnight is less than one hour away, use the following midnight. Where midnight is skipped or repeated by daylight saving, choose the nearest valid start of day at least one hour away and explain it.
- Very long bodies, excerpts, Answers, URLs, line breaks, and unbreakable strings never push Cards or pages horizontally.
- Treat HTML, scripts, control characters, and icon-like characters as text, never structure or operations.
- A Question crossing deadline/reveal while listed moves on the next request and never appears in Open and Results simultaneously.
- Concurrent list changes preserve deterministic per-response order and no same-page duplicate.
- If clipboard access fails, keep the full prompt selectable and show an English failure.
- If authentication expires, the Question is deleted, or body retrieval fails, show no other body and a retryable English error.
- Slow mutations retain processing state and duplicate prevention until success/failure restores the correct operable state.
- One-Answer Results use the same readable structure without overstating comparison.

## Requirements *(required)*

### Functional Requirements

- **FR-001**: Apply one recognizable Challenge visual design across Home, lists, Detail, and Question creation/management.
- **FR-002**: Center an editorial, thought-provoking paper atmosphere and sealed/revealed transition; avoid excessive generic-dashboard decoration.
- **FR-003**: Use consistent heading/body hierarchies, sizes, line heights, readable line lengths, and weights.
- **FR-004**: Base colors on warm paper, dark brown-black ink, orange action/reveal, and amber seal; never rely on color alone.
- **FR-005**: Use readable maximum line length, clear section spacing, consistent Question/Answer surfaces, denser wide layouts, and single-column narrow layouts.
- **FR-006**: Support disclosures, time toggles, Answer expansion, and reveal changes with 150–300 ms transitions without delay; remove decorative motion when reduced motion is requested.
- **FR-007**: All public visible text, operations, states, empty states, and errors MUST be English.
- **FR-008**: Public primary screens MUST NOT show raw user IDs after `Signed in as`.
- **FR-008a**: The shared Header MUST show `Sign in with Google` when signed out and only `Sign out` without raw ID or redundant status when signed in; do not duplicate Sign in at Home bottom or inside Question content.
- **FR-008b**: On `My Questions`, the Header MUST NOT duplicate a link to the current page.
- **FR-009**: Home MUST show at most five `OPEN` Questions ordered by deadline then ID and link to all Open Questions.
- **FR-009a**: Home Hero MUST use `question-planet-right-hollow-mark-16x9.png` at 30% opacity, right-center, nonrepeating.
- **FR-009b**: Hero English copy MUST welcome big Questions, invite the user's biggest Question, and promise distinctive Answers from each respondent's AI Agent.
- **FR-009c**: Home's WebMCP guidance MUST state in an English heading that WebMCP is required to answer.
- **FR-009d**: Keep internal `REVEALED` but present `Results`, `Results available`, and `View results` publicly.
- **FR-009e**: Result Card surfaces MUST link to Detail. Open Cards MUST navigate only through `View question`. Hover MUST only deepen the warm background, without movement or new shadow.
- **FR-009f**: `View question`/`View results` on list Cards and `View question` on My Questions MUST use the shared white Secondary Button.
- **FR-010**: Home MUST show at most ten `REVEALED` Questions ordered by reveal time then ID descending and link to all Results.
- **FR-011**: Home/Open-list items MUST show count and remaining time or deadline in one line with concise accessible icons.
- **FR-012**: Toggling one time display MUST toggle all Questions on that screen.
- **FR-012a**: Visible dates MUST use `YYYY-MM-DD HH:mm`, not seconds, `T`, or trailing `Z`; machine-readable/API ISO 8601 remains.
- **FR-013**: `OPEN`/`CLOSED` sealing MUST use a lock, state color, accessible `Answers are sealed`, and pointer/keyboard help.
- **FR-014**: For authenticated unanswered users, prompt text MUST remain hidden until explicit disclosure within that item.
- **FR-015**: Disclosures MUST be independent, full text selectable, and copy success/failure announced nearby.
- **FR-015a**: `get_question`/`submit_answer` MUST prioritize user-authored context and, absent an explicit view, direct the Agent to submit the best proxy answer without asserting unverified facts, treating inference as known belief, or asking solely due to missing personal view.
- **FR-015b**: The prompt MUST specify ChatGPT's built-in browser rather than an existing Chrome tab while preserving URL, one-line form, submission permission, and context rules.
- **FR-015c**: Authenticated list Cards and Detail MUST show green `Answered` beside state only when the current user answered; show no answer-state tag otherwise or when indeterminate.
- **FR-016**: Open and Result lists MUST show at most 20 items per page with current position and available navigation.
- **FR-017**: Only positive integer pages are valid; empty, out-of-range, and invalid values MUST have safe English presentation and valid navigation.
- **FR-018**: Authenticated `REVEALED` Detail MUST show total, stable excerpts, numbering from `Answer 1`, and body expansion controls.
- **FR-019**: Reveal order MUST be initial submission ascending then ID; never vary by votes, popularity, content, update, or viewer.
- **FR-020**: Fetch only a selected body at that moment and allow multiple fetched bodies to remain open.
- **FR-020a**: In `OPEN`/`CLOSED`, an answered authenticated user sees only their own body/excerpt; no other body, excerpt, ID, respondent, or time is displayed or embedded.
- **FR-021**: Zero Results MUST show `No answers were submitted.`; one uses the same reading structure as multiple.
- **FR-022**: Results MUST hide respondent user ID, email, Google name/image, raw hash, and individual time, and use anonymous numbering.
- **FR-022a**: Results MUST show the authenticated-participant explanation, per-Question icon, and `Authenticated participant`.
- **FR-022b**: Icons MUST remain stable for a Question/Answer, use no user ID, and not become persistent cross-Question identifiers.
- **FR-022c**: Preserve Answer/account linkage only for existing administration/audit/moderation; add no public nickname.
- **FR-022d**: Authenticated Results MUST mark only the session user's Answer as green `Your answer`, deciding server-side and projecting only the result, not respondent ID.
- **FR-023**: Preserve SPEC 008: return no other-user excerpt, body, ID, respondent, time, or count to signed-out users or WebMCP, even after Reveal.
- **FR-024**: Default new deadline to next local `00:00`, or the following day when under one hour away, while remaining editable.
- **FR-025**: Show separate `Save as draft` and `Publish question`; publish immediately without draft confirmation.
- **FR-026**: Every mutation MUST suppress replay from first valid execution through completion and never duplicate create/update/delete through repeat click, form replay, or latency.
- **FR-027**: Owners MUST inspect target/state/count and delete their `DRAFT`/`OPEN`/`CLOSED`/`REVEALED` Questions only after an English irreversible checkbox; deletion area contains only checkbox, button, hidden values, and necessary status.
- **FR-028**: Owner/admin Question deletion MUST cascade all Answers and audit actor, target, outcome, and time without bodies.
- **FR-029**: Only owner or existing administrator may delete; signed-out and non-owner UI/direct requests are consistently rejected.
- **FR-030**: Primary information/actions MUST remain available from 320 px through desktop, at 200% zoom, and by keyboard only.
- **FR-031**: Normal text contrast MUST be at least 4.5:1 and large text/component boundaries 3:1; meaningful icons need names, decorative icons are hidden, status has nonvisual notification, and controls have visible focus.
- **FR-031a**: Administration Question/Answer delete buttons MUST use `Delete`, while confirmation checkboxes identify target type.
- **FR-031b**: Administration user-ban buttons MUST use `Ban`, while confirmation identifies the operation.
- **FR-031c**: Public/admin deletion MUST use a trash icon rather than play/disclosure markers and an adjacent English target/action label.
- **FR-031d**: Administration Home MUST link to `Users`, `Questions`, `Answers`, and `Audit log`; each is a table with at most 20 rows and current/previous/next position.
- **FR-032**: Render long Questions, excerpts, Answers, URLs, and characters as safe text, never executable content, attributes, or structure.
- **FR-033**: Screen tests MUST cover Home limits, pagination, global date toggle, prompt disclosure, sealed/revealed, zero/one/multiple Answers, replay prevention, deadline default, delete authorization, and responsive critical states.
- **FR-034**: Integration tests MUST cover Home-to-Detail, prompt copy, count changes, post-Reveal body retrieval, owner deletion, and WebMCP non-exposure.
- **FR-035**: The demo MUST reproduce Home, Open Detail, prompt, counts zero/one/two, sealing, Reveal, and comparison of two different Answers in order within three minutes.

### Visual Design Direction

- **Theme**: “Observatory for reflection,” combining calm editorial paper with modern state expression.
- **Typography**: Expressive Question/Results headings; readable sans-serif body, metadata, and controls; bounded long-text line length.
- **Palette**: Warm paper, dark brown-black, orange actions, amber sealing; reinforce state with icons and text.
- **Layout**: Question first, then metadata, participation, and Answers; distinct Home sections; single-column vertical comparison.
- **Motion**: Only brief, calm disclosures and state transitions; no constant decoration or reading delay.
- **Responsive**: Single column and touch targets on mobile; spacing/metadata on desktop; never remove content or operations solely due to width.

### Key Entities

- **Question List Item**: Body, state, count, deadline/reveal time, remaining time, Detail action, and available Agent prompt.
- **Question List Page**: State, stable order, current page, at most 20 items, and navigation.
- **Date Display Preference**: Temporary screen-wide remaining-time or deadline selection.
- **Revealed Answer Item**: Anonymous number/icon, `Authenticated participant`, excerpt, expansion state, and selected body, with no public identity or ranking.
- **Question Creation Intent**: Exclusive draft-save or immediate-publish action.
- **State-Changing Operation**: Target, action, processing state, and result treating repeats as one intent.

## Success Criteria *(required)*

### Measurable Outcomes

- **SC-001**: The defined Home-to-two-Answer comparison demo completes within three minutes.
- **SC-002**: At least four of five first-time evaluators identify sealed versus Results, count, and next primary action within 30 seconds without explanation.
- **SC-003**: At least four of five evaluators open any two bodies and identify differences within two minutes.
- **SC-004**: Limits of five Open, ten Results, and 20 per dedicated page hold in 100% of empty, boundary, and over-boundary cases.
- **SC-005**: Target mobile/tablet/desktop widths and 200% zoom have zero unintended horizontal scrolling, missing primary actions, or unreadable overlap.
- **SC-006**: Keyboard-only use reaches every disclosure, copy, toggle, page, expansion, draft, publish, and delete action with identifiable focus.
- **SC-007**: Repeat click, double click, replay, and delayed-response tests always mutate at most one target per user action.
- **SC-008**: Other-user excerpts, bodies, IDs, respondents, and times exposed to signed-out users or WebMCP before/after Reveal total zero.
- **SC-009**: Automated tests pass 100% across primary Question/auth/owner/answer-count states.
- **SC-010**: Public visible text is 100% English and raw-ID `Signed in as ...` occurrences are zero.
- **SC-011**: Every Question with Results shows authenticated-origin explanation and anonymous icons, with zero Google data, user IDs, or cross-Question identifiers.
- **SC-012**: Both WebMCP retrieval and submission contracts communicate proxy answering, no unknown-fact assertion, and no clarification solely for missing personal view in 100% of cases.
- **SC-013**: `Answered` appears correctly only for the current user's answered Cards/Detail, with zero false tags.
- **SC-014**: `Your answer` appears only on the current user's Result, with zero other-user tags or respondent user IDs in public HTML.

## Assumptions and Dependencies

- Reuse SPEC 005 state, SPEC 006 creation/ownership, SPEC 007 prompt/tools, SPEC 008 access control, and SPEC 009 Home/Detail/administration/audit.
- Keep the existing deadline/reveal lifecycle model.
- Only authenticated humans read Results; signed-out users see Sign in; Personal Agents retrieve only their own Answer.
- Date-display preference is temporary, not an account setting.
- Use initial submission order for fairness/reproducibility; no voting, recommendation, or randomization.
- Generate anonymous icons only from Question and Answer IDs at display time; persist no public user identifier.
- Confirmed owner deletion cascades Answers; no restoration.
- MILESTONE requires Tailwind CSS and React Icons; add no new screen framework.
- All screen text is English; SpecKit documents are Japanese.

## Out of Scope

- Voting, ranking, recommendation, search, summarization, or side-by-side diff
- Agent discussion, consensus, or follow-up questions
- Other-user Answers for signed-out users or WebMCP
- Restoration, soft delete, or trash
- New user profiles, avatars, or public raw IDs
- A standalone design-system product, theme switching, or exhaustive cross-browser audit
