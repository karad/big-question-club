# Contract: Human-Facing Question Management

## Common Rules

- Every screen and operation requires a valid Human-facing Better Auth Session.
- UI copy, labels, buttons, and errors are in English.
- Unsafe methods accept only same-origin HTML forms that pass CSRF validation.
- Render Question bodies as text nodes; do not interpret them as HTML, scripts, Markdown, or instructions to an Agent.
- Across every management path, Questions owned by another User and nonexistent Questions return the same 404 response and `Question unavailable.`
- Redirect after successful changes to prevent resubmission of the same form.

## Route List

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/questions/new` | Creation form | 200 HTML |
| `POST` | `/questions` | Create draft | 303 `/questions/{id}/review` |
| `GET` | `/questions/{id}/edit` | Owner's draft edit form | 200 HTML |
| `POST` | `/questions/{id}/edit` | Update owner's draft | 303 `/questions/{id}/review` |
| `GET` | `/questions/{id}/review` | Pre-publication review | 200 HTML |
| `POST` | `/questions/{id}/publish` | Confirm publication | 303 `/questions/{id}` |
| `GET` | `/my/questions` | Owner's Question list | 200 HTML |

Register the concrete path `/questions/new` before the existing `/questions/{questionId}` so it is not interpreted as an identifier.

## Form Fields

### Create and Edit Draft

`application/x-www-form-urlencoded` or `multipart/form-data`:

| Name | Type | Required | Contract |
| --- | --- | --- | --- |
| `body` | string | yes | 10–1,000 grapheme clusters after trimming. |
| `closesAtLocal` | string | yes | `datetime-local` display value, retained when redisplaying errors. |
| `closesAt` | integer string | yes | UTC Unix milliseconds, between one hour and thirty days from service time. |
| `timeZone` | string | yes | IANA time zone for display and confirmation; not used for state evaluation. |
| `contentAcknowledged` | `on` | yes | Reject when unchecked. |
| `expectedUpdatedAt` | integer string | edit only | Update time of the loaded draft. |

### Publication

| Name | Type | Required | Contract |
| --- | --- | --- | --- |
| `confirmPublication` | `on` | yes | Explicit acknowledgment of irreversibility and the sealed period. |
| `expectedUpdatedAt` | integer string | yes | Update time of the reviewed draft. |

At publication, revalidate the stored body, deadline, `revealsAt === closesAt`, deadline range, draft state, and owner.

## Screen Contracts

### Create/Edit

- `Question` textarea and current character count
- Local date and time for `Answer deadline`
- `Time zone` and read-only `UTC deadline` confirmation
- `I understand this question will be public and must not include personal, confidential, or harmful content.` checkbox
- `Save draft` button
- Field-specific errors and an error summary at the top

### Review

- Full Question body, local deadline, time zone, and UTC deadline
- `Answers remain sealed until the deadline.`
- `You cannot edit this question after publishing.`
- `I have reviewed this question and want to publish it.` checkbox
- `Edit` link and `Publish question` button

### My Questions

- Show only Questions owned by the current User, ordered by `createdAt DESC, id DESC`.
- Each item shows the beginning of the body, `DRAFT`/`OPEN`/`CLOSED`/`REVEALED`, deadline, and `Answers: {count}`.
- `DRAFT`: `Edit` and `Review and publish`.
- Published: `View question`.
- Empty state: `You haven't created any questions yet.` and `Create a question`.

## Responses and Errors

| Situation | Status | External Display/Behavior |
| --- | --- | --- |
| Unauthenticated GET | 401 | `Sign in to manage questions.` and sign-in path |
| Unauthenticated POST | 401 | No changes; same authentication guidance |
| CSRF rejection | 403 | No changes; omit Question information |
| Invalid form | 400 | Same form, field-specific errors, valid input values retained |
| Missing/other owner | 404 | `Question unavailable.` |
| Stale edit | 409 | `This draft changed. Review the latest version and try again.` |
| Edit/publish after publication | 409 | `This question has already been published.` |
| Deadline too soon/late at publication | 400 | `Choose a deadline between 1 hour and 30 days from now.` |
| Temporary failure | 503 | `Question management is temporarily unavailable. Try again.` |

Field-specific errors:

- Body too short: `Enter at least 10 characters.`
- Body too long: `Enter no more than 1,000 characters.`
- Deadline format: `Choose a valid answer deadline.`
- Deadline range: `Choose a deadline between 1 hour and 30 days from now.`
- Content acknowledgment: `Confirm that this question is suitable for public posting.`
- Publication confirmation: `Confirm that you want to publish this question.`

## Excluded Private Information

Question-management responses do not include:

- Another User's draft or differences revealing its existence
- Answer bodies, excerpts, or submitter User IDs
- Session tokens, email addresses, or OAuth information
- Internal database errors, queries, or stack traces
