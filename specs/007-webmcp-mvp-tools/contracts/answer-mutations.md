# Answer HTTP Contract

## Common Rules

- Every endpoint requires an authenticated same-origin Session.
- Determine User ID from the Session, never the request body.
- JSON requests accept only defined fields.
- Return `Cache-Control: no-store` for both success and error responses.
- Answer body is 1–5,000 non-whitespace display characters. Excerpt is 1–160 non-whitespace display characters with no newline.

## `GET /api/questions/:questionId`

Return only an `OPEN` Question in the Question Tool View from the [WebMCP contract](./webmcp-tools.md).

| HTTP | `code` | Condition |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Missing Question or Draft |
| 409 | `QUESTION_CLOSED` | `CLOSED` or `REVEALED` |
| 500 | `TOOL_UNAVAILABLE` | Temporary failure |

## `POST /api/questions/:questionId/answers`

Request:

```json
{ "answer": "Public answer text.", "excerpt": "One-line excerpt." }
```

Success returns a `submitted` result with `201 Created`.

| HTTP | `code` | Condition |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | Invalid shape or character count |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Missing Question or Draft |
| 409 | `QUESTION_CLOSED` | Not `OPEN` |
| 409 | `ANSWER_ALREADY_SUBMITTED` | Current User already has an Answer |
| 500 | `TOOL_UNAVAILABLE` | Temporary failure |

## `PUT /api/questions/:questionId/my-answer`

Request:

```json
{ "answer": "Revised answer.", "excerpt": "Revised excerpt." }
```

Success returns an `updated` result with `200 OK`. Preserve `createdAt` and Answer ID, and advance `updatedAt` to service time.

| HTTP | `code` | Condition |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | Invalid shape or character count |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Missing Question or Draft |
| 404 | `ANSWER_NOT_FOUND` | Current User has no Answer |
| 409 | `QUESTION_CLOSED` | Not `OPEN` |
| 500 | `TOOL_UNAVAILABLE` | Temporary failure |

## `DELETE /api/questions/:questionId/my-answer`

The request has no body. Success returns a `removed` result with `200 OK`.

| HTTP | `code` | Condition |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Missing Question or Draft |
| 404 | `ANSWER_NOT_FOUND` | Current User has no Answer |
| 409 | `QUESTION_CLOSED` | Not `OPEN` |
| 500 | `TOOL_UNAVAILABLE` | Temporary failure |

## `GET /api/questions/:questionId/my-submission`

Success returns the current User's `not_submitted` or `submitted` view with `200 OK`. After deletion it returns `not_submitted`; after update it returns the latest body, excerpt, and `updatedAt`.

| HTTP | `code` | Condition |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | Unauthenticated |
| 404 | `QUESTION_NOT_FOUND` | Missing Question or Draft |
| 500 | `TOOL_UNAVAILABLE` | Temporary failure |

## Non-Enumeration and Conflicts

- Updating or removing when only another User's Answer exists still returns `ANSWER_NOT_FOUND`.
- Update/remove commit owner, Question, and `OPEN` checks in the same conditional write.
- A conflicting update arriving after removal does not restore the Answer.
- Failures return neither another User's Answer, the current User's old body, nor internal affected-row counts.
