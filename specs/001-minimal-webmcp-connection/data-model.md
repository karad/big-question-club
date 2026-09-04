# Data Model: Minimal WebMCP Connection

This SPEC has no persistent data. The verification Question is treated as a fixed value within the application.

## Verification Question

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `id` | string | Yes | A unique value that does not change during the verification period. |
| `question` | string | Yes | A non-blank English sentence asking how people should prepare for a future in which AI increasingly automates work. |
| `language` | string | Yes | Fixed to `en`. |

## Relationships and State

- Exactly one verification Question always exists.
- It has no relationship to a User, Session, or Answer.
- Creating, updating, deleting, or transitioning the state of a Question is outside the scope of this SPEC.

## Validation Rules

- All three fields must exist and be non-empty.
- Retrieval must always return the same result within the same runtime environment.
- Input not defined by the contract must not affect the Question content.
