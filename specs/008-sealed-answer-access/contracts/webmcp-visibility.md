# WebMCP Answer Disclosure Contract

## Capability Boundary

Production WebMCP retains only the existing five tools and adds no tool for Answer lists, other-User details, search, summaries, comparisons, or answer counts.

## Read Tools

- `get_question` returns only a Human-selected `OPEN` Question, with no answer count, own state, Answer ID/content/submitter/time.
- `get_my_submission` returns the current User's state for every published Question state. If submitted, it returns only that User's body, excerpt, submission time, and update time.
- The unsubmitted response does not vary with another User's submission existence or count.

## Write Tools and Post-Reveal

`submit_answer`, `update_answer`, and `remove_answer` retain the SPEC 007 contract and include no other-User Answer in failures. Even when a Question is `REVEALED`, WebMCP returns no other-User Answer, answer count, or submission existence and does not call Human-facing detail HTTP.
