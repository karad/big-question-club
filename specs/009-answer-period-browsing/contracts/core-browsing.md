# Contract: Challenge Core Browsing Screens

## Routes

| Method | Path | Authentication | Purpose | Success |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Optional | Open Question list | 200 HTML |
| `GET` | `/questions/{id}` | Optional | Question Detail | 200 HTML |

Do not change existing `/api/auth/*`, Question-management routes, or WebMCP tool routes.

## Home

- Show only `OPEN` Questions ordered by `closesAt ASC, publishedAt ASC, id ASC`.
- Each item shows body, `0 answers|1 answer|n answers`, `Answers are sealed`, absolute UTC deadline, nonnegative remaining time, and detail link.
- Empty state: `No open questions right now.`
- Retrieval failure: 503 and `Questions are temporarily unavailable. Try again.`; never convert it to empty state.
- Include no Answer body, excerpt, ID, User, or individual timestamp in HTML.

## Question Detail

### Common Public Information

- Question body, state, answer count, absolute UTC deadline, and remaining time.
- Indicate ownership to the creator; show no personal information to others.
- Render the body as untrusted text.

### `OPEN`, Signed Out

- `Answers are sealed`
- Explanation that independent Answers remain private until the deadline
- `Sign in to answer with your personal agent.` and existing Google sign-in path
- Zero Agent prompts, personal submissions, or other-User Answer data

### `OPEN`, Authenticated and Unanswered

- SPEC 007 `Ask your personal agent`, prompt containing current-Origin absolute URL, `Copy prompt`, and Clipboard status
- One-line prompt: `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`
- WebMCP prioritizes available User-authored statements and does not treat Assistant suggestions/options as facts. With no explicit personal view, it creates and submits a best-effort proxy without asserting unverified facts or known beliefs and does not ask solely because that view is missing.
- The initial prompt authorizes creation/submission without another preview or approval; verify personal submission afterward.
- Zero personal submissions or other-User Answer data

### `OPEN`, Authenticated and Answered

- `Your agent has answered.`
- `Your answer remains sealed until the deadline.`
- Own Answer
- Zero new prompts or other-User Answer data

### `CLOSED`

- Acceptance closed and sealing continues
- Zero new prompts or other-User Answer data
- Authenticated Users can still inspect their own Answer under SPEC 008

### `REVEALED`

- Zero new prompts
- Preserve SPEC 008 minimum Reveal browsing
- SPEC 010 defines finished comparison and visual design

### Errors

| Situation | Status | Display |
| --- | --- | --- |
| Missing or Draft | 404 | Identical `Question unavailable.` |
| Home retrieval failure | 503 | `Questions are temporarily unavailable. Try again.` |
| Detail public-data failure | 503 | `Question is temporarily unavailable. Try again.` |
| Personal-state failure | 200 | `Your submission status is temporarily unavailable. Try again.`, with no prompt or private data |

## Response Boundaries

- User-dependent Detail retains `Cache-Control: private, no-store` and `Vary: Cookie`.
- State and remaining time within one request use the same service-time snapshot.
- In `OPEN`/`CLOSED`, include no other-User body, excerpt, ID, User, or individual time in content, attributes, embedded data, or errors.
- Application UI is English; Question and own Answer appear exactly as entered.
