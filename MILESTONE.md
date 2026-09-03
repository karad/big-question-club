# Big Question Club — MVP Milestones

These milestones prioritize the value required for the Challenge submission and divide each SPEC into units that can be completed by the deadline. Work on each SPEC begins only after the preceding SPEC meets its acceptance criteria. On completion, change the leading `[ ]` to `[x]`.

## Operating Rules

- Before implementing each SPEC, use SpecKit to create `spec.md`, `plan.md`, and `tasks.md`.
- Write documents created with SpecKit in Japanese.
- Break down `tasks.md` into dependency-ordered tasks aligned with the deadline and priority of each SPEC. Include implementation, testing, documentation, and manual verification.
- Do not begin full implementation of P1 or later SPECs until the P0 technical-validation SPECs receive a Go decision.
- When a SPEC is complete, record its acceptance criteria, test results, and unresolved issues in the SPEC's `quickstart.md` or an equivalent validation record.

## P0 — Validate Concept Viability

- [x] **SPEC 001 — Runtime Foundation and Minimal WebMCP Connection**
  - Objective: Set up Cloudflare Workers, Hono, and Vite, and make it possible to execute a minimal WebMCP Tool that returns a fixed validation Question.
  - Information finalized with SpecKit: Target runtime, local development and deployment methods, how WebMCP is exposed, environment variables, fixed Question contract, and manual connection-verification procedure.
  - Completion criteria: A Personal Agent can call the validation Tool and retrieve the fixed Question.

- [x] **SPEC 002 — Validate Google OAuth and WebMCP User Identification**
  - Objective: Verify that a user signed in with Google OAuth can also be identified as the same user in a WebMCP Tool Call.
  - Information finalized with SpecKit: Google Cloud OAuth consent screen, OAuth client, authorized redirect URI, Better Auth configuration, required Secrets, Session handoff method, and Go/No-Go decision on failure.
  - Completion criteria: A Tool equivalent to `who_am_i` returns the same authenticated user in the browser and WebMCP.

- [x] **SPEC 003 — Validate Personal Agent Answer Safety and Language**
  - Objective: Verify that an Agent can use Personal Context for reasoning without outputting Private Context, refuse Prompt Injection, and answer in the same language as the Question.
  - Information finalized with SpecKit: Validation Question set, Tool description, untrusted-content boundary, criteria for leakage, Injection, and language matching, unacceptable outcomes, and Go/No-Go decision.
  - Completion criteria: Meet the defined safety and language success criteria for six Critical Go cases: Japanese and English plus four categories of Injection Questions. Retain the remaining eight cases for later regression validation.

- [x] **SPEC 004 — Validate Agent Answer Submission Integrity and Sealed Answers**
  - Objective: Permit an authenticated user to submit only one Answer per Question and keep every other user's Answer body private through every path until the deadline.
  - Information finalized with SpecKit: Minimal D1 Schema, `UNIQUE(question_id, user_id)`, duplicate and concurrent-submission behavior, time boundaries, access policy by API, SSR, and WebMCP, and validation matrix.
  - Completion criteria: Duplicate submissions are rejected, another user's Answer body cannot be retrieved before Reveal, and it can be viewed on the human-facing screen after Reveal.

## P1 — Full MVP Implementation

- [x] **SPEC 005 — Domain Data Model and Question Lifecycle**
  - Objective: Implement the production Schema for storing users, questions, answers, and sessions, together with the `DRAFT → OPEN → CLOSED → REVEALED` state transitions.
  - Information finalized with SpecKit: Drizzle Schema and Migration, responsibility of each entity, time standard and timezone, state-transition table, Repository boundaries, data-integrity rules, and unit-test targets.
  - Completion criteria: State transitions and constraints are tested against a migrated DB, and the current state of a Question can be determined uniquely.

- [x] **SPEC 006 — Question Creation and Publication Flow**
  - Objective: Enable an authenticated Human to create and manage publishable Questions by specifying the Question text and answer deadline. The Personal Agent determines the answer language from the Question text.
  - Information finalized with SpecKit: User stories for the creation screen, inputs, character limits, language-selection method, deadline constraints, initial Moderation policy, error displays, and necessary scope of My Questions.
  - Completion criteria: A Question Creator can create a valid Question, and invalid inputs or unauthorized operations are properly rejected.

- [x] **SPEC 007 — WebMCP MVP Tool Set**
  - Objective: Starting from a copyable prompt on the Question screen, provide the minimum Tool set for an Agent to retrieve a Human-selected Open Question, submit and confirm an independent Answer, and update or delete the owner's Answer on request before the deadline.
  - Information finalized with SpecKit: Use ChatGPT's built-in browser without using an existing Chrome Tab; a one-line English copyable prompt containing an absolute Question URL that follows the current Origin, plus the copy interaction; Context-evidence rules delivered from each Tool to the Agent separately from the prompt and prioritizing the User's own statements; the best proxy answer when no explicit personal view exists; no assertion of unverified facts; prohibition on clarification questions based only on insufficient personal views; submission authorization from the initial Prompt without additional approval; confirmation of the submission result; input/output contracts for `get_question`, `submit_answer`, `update_answer`, `remove_answer`, and `get_my_submission`; Human Question selection; authorization; error contract; character limits; Tool descriptions; exclusion of private data; and Integration Test scenarios.
  - Completion criteria: An authenticated Human can paste the prompt from a Question screen into a Personal Agent, complete submission and confirmation for that Question, and update or delete their Answer before the deadline. The Agent does not discover Questions automatically and cannot access or modify another Agent's Answer.

- [x] **SPEC 008 — Access Control for Sealed Answers**
  - Objective: Use Question state as the sole decision source and consistently enforce Answer visibility before and after Reveal across SSR, HTTP API, and WebMCP.
  - Information finalized with SpecKit: Access-control policy, response rules for answer counts, the owner's Answer, and other users' Answers, protection from direct HTTP access, boundary-time behavior, and regression-test matrix.
  - Completion criteria: Tests for every public path show that no other user's Answer body, preview, or summary leaks before Reveal.

- [x] **SPEC 009 — Challenge Core Browsing Flow**
  - Objective: Complete the essential Home and Question Detail features so that a Human can select an Open Question, ask a Personal Agent to answer, and observe changes in the answer count and sealed state.
  - Information finalized with SpecKit: Open Question list; answer-count, deadline, and sealed display; minimum states for signed-out users, creators, users who have not answered, and users who have answered; integration of the Agent-request prompt from SPEC 007; Context-evidence rules prioritizing the User's own statements; best proxy answer when no explicit personal view exists; no assertion of unverified facts; prohibition of unnecessary clarification questions; submission authorization from the initial Prompt without additional approval; non-exposure regression coverage from SPEC 008; and automated-test scope.
  - Completion criteria: The pre-answer, one-answer, multiple-answer, and sealed states from the three-minute demo can be reproduced as working features, with no leakage of another user's Answer before Reveal. Dedicated Login, My Questions redesign, and final Visual Design are excluded.
  - Additional SPEC: Reason → The web application will be publicly accessible on the internet by anyone, not only the judges.
    - Log sign-in, sign-out, Question input, and Answer input in the DB together with the account that performed each action.
    - Create an administration screen. There is only one administrator account, specified in `.env`.
    - Users other than the administrator cannot sign in to the administration screen.
    - The administration screen can display lists of users, questions, answers, and logs.
    - The administrator can delete Questions and Answers. Editing is not required.
    - The administration screen can BAN users.

- [x] **SPEC 010 — Reveal Experience and Challenge Visual Design**
  - Objective: Make differences among multiple independent answers easy for Humans to read after Reveal, and complete Home, Question Detail, sealed, and Reveal as a consistent, high-quality experience.
  - Information finalized with SpecKit: Visual Direction for the Challenge, Typography, Color, Layout, Motion, Responsive presentation, completed Home and in-period Detail displays, post-Reveal Answer list and body display, ordering that supports comparison, empty states, English text, baseline Accessibility, and screen transitions plus UI / Integration Tests for the three-minute demo.
  - Completion criteria: For two or more different Personal Agent answers to the same Question, the `sealed → unsealed` transition and differences between answers are visually clear in a three-minute demo. The Core screens from Home through Reveal results share consistent Visual quality, and WebMCP cannot retrieve another Agent's Answer. Prioritize the Additional SPEC first.
  - Additional SPEC
    - Use Tailwind CSS for all styling. Use https://react-icons.github.io/react-icons/ for icons.
    - Do not display `Signed in as TFym9cJ4Sp81IJaZJD6sT1SD81KWUCeU.`.
    - Add a prompt-copy area to the Open Questions list as well. Show a prompt field and copy button after one click, similar to GitHub's Clone control.
    - Display Answers and remaining on one line beneath each listed Question, using simple icons.
    - Clicking remaining switches it to Deadline. Switching changes every date at once.
    - Make `Answers are sealed` visually recognizable with an icon and assign the textual information to the icon.
    - On the top page, display a list of five Open Questions and ten Questions whose answers can be viewed. Also show links to each full list page.
    - Limit Question list pages to 20 items per page and navigate with pagination.
    - Provide a default Deadline of 00:00 one day later.
    - Answers on the Question Detail page
    - Prevent double-clicks because they cause duplicate submissions.
    - Allow users to delete Questions they created themselves.
    - On Question creation, provide both `Save as draft` and `Publish` buttons so the Question can be published immediately.

## P2 — Quality Improvements If Time Permits

- [ ] **SPEC 011 — Additional Quality Assurance and Submission Improvements (If Time Permits)**
  - Objective: After SPEC 009 and 010 complete the Core experience required for the Challenge submission, use the remaining time to improve additional quality assurance, operational documentation, and submission materials.
  - Information finalized with SpecKit: Comprehensive Cross-browser / Accessibility / JavaScript-disabled validation, additional failure and boundary Matrices, refined deployment procedure, expanded README and Quickstart, improved screenshots and submission copy, and known constraints, limited to what can be tested automatically.
  - Completion criteria: The selected additional quality items are validated and recorded within the available time. This SPEC is not a requirement for completing the Challenge Core.

## P3 — Undecided Ideas



## Out of Scope

The MVP intentionally does not implement Agent-to-Agent discussion, Answer voting or ranking, consensus formation, Answer summaries, Personal Context storage, or use of an LLM by the application itself.
