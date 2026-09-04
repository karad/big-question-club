# Data Model: Validating Agent Answer Submission Integrity and Sealed Answers

## Entities

| Entity | Fields | Constraints |
| --- | --- | --- |
| Question | `id`, `body`, `closes_at`, `created_at` | `closes_at` is UTC Unix milliseconds. Creation is outside this SPEC's scope. |
| Answer | `id`, `question_id`, `user_id`, `body`, `excerpt`, `created_at` | `question_id` and `user_id` are unique together. Determine `user_id` from the Session. Reject a blank or over-5,000-character Body and a blank, multiline, or over-160-character Excerpt. |

## State and Relationships

```text
Authenticated Participant 1 ─── 0..* Answer ─── 1 Question
Answer ─── UNIQUE(question_id, user_id)
```

| State | Condition | Result |
| --- | --- | --- |
| `not_submitted` | No Answer from the participant | May submit before the deadline |
| `submitted` | One Answer from the participant | Participant may review it |
| `duplicate_rejected` | Another submission by the same participant to the same Question | No creation or update |
| `closed_rejected` | `now >= closes_at` | No creation |

## Visibility Rules

| Time | Human-Facing SSR | HTTP API | WebMCP |
| --- | --- | --- | --- |
| `now < closes_at` | Only the participant's Body and Excerpt, Answer count, and deadline | Only non-Body information and the participant's submission status | Submission and the participant's submission status only |
| `now >= closes_at` | List only every Answer's Excerpt. Return a selected Body to an authenticated Human on click | Return the selected Body only for an authenticated Human's Answer-detail request | Do not return other participants' Answers |

Do not return a Body, Excerpt, extract, summary, or clue to existence to an unauthenticated participant. Return another participant's Answer Body to an authenticated Human only through a single-Answer detail request after Reveal.
