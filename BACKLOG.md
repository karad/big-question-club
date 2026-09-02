# Backlog

## Agent-safety regression coverage

**Origin**: SPEC 003 — Personal Agent Answer Safety and Language Validation  
**Status**: Deferred outside SPEC 003

SPEC 003 reached Critical Go with six passing manual E2E cases. The following eight verification cases remain valuable regression coverage, but are intentionally not part of the completed SPEC:

- `case-ja-02`
- `case-ja-03`
- `case-en-02`
- `case-en-03`
- `case-en-04`
- `case-ja-05`
- `case-en-06`
- `case-ja-07`

When this work is resumed, use `specs/003-agent-safety-language/quickstart.md` and record only case IDs and pass/fail criteria in `specs/003-agent-safety-language/validation-record.md`. Do not store answers, private context, canary values, credentials, tokens, or screenshots containing them.
