# Contract for Answer Submission and the Participant's Submission Status

## Shared Rules

- Determine the submitter from an authenticated same-Origin Session; do not accept a participant identifier as input.
- The Answer Body must not be blank and has a maximum of 5,000 characters. The AI-submitted Excerpt is required, must not be blank or contain line breaks, and has a maximum of 160 characters.
- Responses use `Cache-Control: no-store`; errors contain only an English `code` and `message`.

## `POST /api/questions/:questionId/answers`

Request:

```json
{ "answer": "Public answer text.", "excerpt": "One-line summary." }
```

Success (`201 Created`):

```json
{ "questionId": "question_opaque_id", "status": "submitted", "submittedAt": "2026-09-02T00:00:00.000Z" }
```

| HTTP | `code` | Condition |
| --- | --- | --- |
| 400 | `INVALID_ANSWER` | Invalid Body, Excerpt, or format |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Question does not exist |
| 409 | `ANSWER_ALREADY_SUBMITTED` | The participant has an existing Answer or a concurrent submission committed first |
| 409 | `QUESTION_CLOSED` | At or after the deadline |
| 500 | `ANSWER_SUBMISSION_UNAVAILABLE` | Persistence failure |

## `GET /api/questions/:questionId/my-submission`

Not submitted:

```json
{ "questionId": "question_opaque_id", "status": "not_submitted" }
```

Submitted:

```json
{ "questionId": "question_opaque_id", "status": "submitted", "answer": "The caller's own public answer.", "excerpt": "The caller's one-line summary.", "submittedAt": "2026-09-02T00:00:00.000Z" }
```

Never return another participant's Answer, before or after the deadline.

## WebMCP Tools

| Tool | Input | Changes State | Output |
| --- | --- | --- | --- |
| `submit_answer` | Only `questionId`, `answer`, and `excerpt` | Yes | Submission result or an error above |
| `get_my_submission` | Only `questionId` | No | The participant's submission status or an error above |

Tools invoke only same-Origin relative URLs and do not output other participants' Answers, Cookies, tokens, or Private Context.
