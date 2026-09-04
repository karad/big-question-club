# Tool Contract: `get_verification_question`

## Purpose

Return the single verification Question to a Personal Agent through WebMCP.

## Exposure Conditions

- Expose the Tool on a top-level, same-Origin page in a supported browser.
- Register the Tool statically when the page loads.
- The Tool is read-only.
- Do not require login, personal information, Personal Context, or a connection to an external service.

## Input

No input is accepted. The input Schema is an empty object, and additional properties are not allowed.

## Success Result

```json
{
  "kind": "question",
  "id": "verification-question-v1",
  "question": "How should people prepare for a future where AI can do most of today's work?",
  "language": "en"
}
```

## Failure Result

```json
{
  "kind": "error",
  "code": "SERVICE_UNAVAILABLE | INVALID_CONFIGURATION | INVALID_ARGUMENT | REQUEST_CANCELLED",
  "retryable": true,
  "message": "A safe, actionable English message."
}
```

A failure result does not include `id`, `question`, or `language`. `INVALID_CONFIGURATION` and `INVALID_ARGUMENT` are not retryable; `SERVICE_UNAVAILABLE` and `REQUEST_CANCELLED` are retryable.

## Non-Guarantees

- Generating, posting, or saving an Answer
- Identifying an authenticated user
- Listing or selecting Questions, or switching languages
- Returning other Questions or User Generated Content
