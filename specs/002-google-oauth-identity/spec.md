# Feature Specification: Validating Google OAuth and WebMCP User Identification

**Feature Branch**: `002-google-oauth-identity`

**Created**: 2026-09-01

**Status**: Draft

**Input**: "Implement 002 in MILESTONE.md"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Use WebMCP as the Logged-In User (Priority: P1)

When a user signs in to Big Question Club with a Google account, a Personal Agent running in the same browser identifies them as that logged-in account when it invokes the WebMCP identity verification Tool.

**Why this priority**: This is a prerequisite for correctly associating an Agent's Answer with its user and preserving the later MVP invariant of one Answer per user per Question.

**Independent Test**: Sign in to the browser with a test Google account, then invoke the identity verification Tool from a WebMCP-compatible Personal Agent in the same browser. Confirm that the browser screen and Tool response show the same Big Question Club user identifier.

**Acceptance Scenarios**:

1. **Given** a user is signed in to Big Question Club with a Google account, **When** the identity verification Tool is invoked, **Then** it returns only the stable Big Question Club identifier of the logged-in user.
2. **Given** a user is signed in with a Google account, **When** user information is checked on the browser screen and through the identity verification Tool, **Then** both show the same Big Question Club user identifier.
3. **Given** the same login state is maintained, **When** the identity verification Tool is invoked repeatedly, **Then** every response returns the same identifier.

---

### User Story 2 - Identify Accounts Without Confusing Them (Priority: P2)

A developer can confirm that participants signed in with different Google accounts are not incorrectly identified as each other's Big Question Club user through WebMCP.

**Why this priority**: Association with the wrong account is a critical failure that would break Answer ownership, duplicate-submission control, and creator permissions.

**Independent Test**: Sign in and invoke the identity verification Tool separately with two different test Google accounts. Confirm that their identifiers differ and never cross over.

**Acceptance Scenarios**:

1. **Given** two different Google accounts can each sign in to Big Question Club, **When** the identity verification Tool is invoked through WebMCP for each account, **Then** it returns a different Big Question Club user identifier for each.
2. **Given** a user is signed out, **When** the identity verification Tool is invoked through WebMCP, **Then** it does not guess a user and explicitly reports that authentication is required.
3. **Given** a user signs in with another Google account after signing out, **When** the identity verification Tool is invoked, **Then** it returns only the newly signed-in account's identifier.

---

### User Story 3 - Make a Go/No-Go Decision from Validation Results (Priority: P3)

The product owner can determine from reproducible records whether the browser login and WebMCP Tool Call identify the same user.

**Why this priority**: If this validation fails, the authentication design must be reconsidered before proceeding to subsequent Agent Answer submission.

**Independent Test**: Perform the specified checks while signed in, signed out, and after switching accounts, then record expected and observed results in the validation record.

**Acceptance Scenarios**:

1. **Given** the required authentication configuration and test Google accounts are ready, **When** the validation procedure is performed from the beginning, **Then** the results required for a Go/No-Go decision can be recorded within 30 minutes.
2. **Given** any signed-in invocation returns an identifier different from the browser or an unauthenticated result, **When** the validation result is evaluated, **Then** record No-Go and do not begin subsequent Agent Answer submission.

### Edge Cases

- If Google authorization is cancelled or denied by the participant, do not treat them as signed in; show a retryable failure.
- If authentication information is expired, corrupted, or missing, the identity verification Tool must not return a past user identifier or an anonymous substitute identifier.
- While the browser login state is switching, or when multiple accounts are available for selection, the Tool must not guess an identity and must require establishment of an unambiguous login state.
- Authentication Secrets, Google account email addresses, access tokens, and Session values must not appear in screens, Tool responses, or validation records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST associate a participant who signs in with Google OAuth with one stable user identifier in Big Question Club.
- **FR-002**: For the WebMCP identity verification Tool invoked in the same browser as a logged-in browser Session, the system MUST return the same Big Question Club user identifier.
- **FR-003**: The system MUST NOT include a Google account email address, authentication information, Secret, or Session value in the identity verification Tool response.
- **FR-004**: The system MUST NOT associate an unauthenticated WebMCP invocation, an invocation with expired authentication, or one with invalid authentication information with a specific Big Question Club user.
- **FR-005**: The system MUST NOT return the same identifier for Big Question Club users created from different Google accounts.
- **FR-006**: For a WebMCP invocation after sign-out or signing in with another account, the system MUST return an identifier corresponding only to the current login state.
- **FR-007**: Excluding sensitive information, the system MUST document the Google OAuth consent screen, OAuth client, authorized redirect URIs, required Secrets, and validation authentication configuration in a form developers can reproduce.
- **FR-008**: The system MUST provide exactly one identity verification Tool for confirming that the browser and WebMCP identify the same user.
- **FR-009**: The system MUST record validation results for signed-in, signed-out, two different accounts, and account-switching cases, and MUST decide Go only when every case meets its expected result.
- **FR-010**: The system MUST decide No-Go if any signed-in validation produces identifiers that differ between the browser and WebMCP or is treated as unauthenticated.
- **FR-011**: Within this SPEC's scope, the system MUST NOT provide Question creation, Answer submission, Answer viewing, multi-user production operation, or Personal Context transmission.

### Key Entities

- **Big Question Club User**: An entity corresponding to a participant authenticated through Google OAuth, with a stable service-internal identifier.
- **Authenticated State**: A state in which the Big Question Club user signed in through the browser can be confirmed. WebMCP identity verification must resolve to the same entity.
- **Identity Verification Tool**: A validation-only operation that returns only the identifier of the currently authenticated Big Question Club user through WebMCP.
- **Validation Record**: A record of each login state, expected result, observed identity result, and Go/No-Go decision.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across ten consecutive signed-in validations with the same test Google account, the browser and WebMCP Big Question Club user identifiers match all ten times.
- **SC-002**: Across five WebMCP invocations for each of two different test Google accounts, the identifier remains constant within each account and zero responses match across accounts.
- **SC-003**: Across at least one check each after sign-out, authorization denial, and authentication expiration, zero cases return a specific user identifier.
- **SC-004**: A developer following the documented procedure can check the four cases—signed in, signed out, another account, and account switching—and record a Go/No-Go decision within 30 minutes.
- **SC-005**: Review of screens, Tool responses, and validation records captured during validation finds zero exposures of Google account email addresses, authentication information, Secrets, or Session values.

## Assumptions

- At least two test Google accounts and a WebMCP-compatible Personal Agent are available for validation.
- Google OAuth and Better Auth are validation targets specified by the milestone. This SPEC confirms feasibility of their adoption and user identification.
- The identity verification Tool is dedicated to P0 validation and does not determine the public contract for actual Question-retrieval or Answer-submission Tools in subsequent SPECs.
- Actual Google OAuth client configuration and Secret values are not stored in the repository, screens, Tool responses, or validation records.
- Decide Go only if same-user identification between the browser and WebMCP meets every success criterion. Otherwise decide No-Go and do not proceed to subsequent Agent Answer submission.

## Dependencies

- SPEC 001, "Runtime Foundation and Minimal WebMCP Connection," is complete and a verification Tool can be invoked from a WebMCP-compatible Personal Agent.
- An OAuth consent screen, OAuth client, and authorized redirect URIs can be configured for validation in a Google Cloud project.
- Better Auth can handle a state authenticated through Google OAuth.

## Out of Scope

- Generating, submitting, saving, deduplicating, or viewing Answers
- Creating or publishing Questions, deadlines, or Reveal
- Transmitting, saving, outputting, or validating the availability of Personal Context
- Prompt Injection protection and Question/Answer language matching validation
- Production participant account management, deletion, unlinking, or guarantees of Sybil Resistance
