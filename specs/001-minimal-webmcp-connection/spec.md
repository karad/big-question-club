# Feature Specification: Minimal WebMCP Connection

**Feature Branch**: `001-minimal-webmcp-connection`

**Created**: 2026-09-01

**Status**: Draft

> **Note added 2026-09-02**: The `language` field in this SPEC is fixed data for the initial connection verification and is not part of the current product contract. Actual Questions do not specify a primary language; the Personal Agent determines the response language from the text.

**Input**: "Implement SPEC 001 in MILESTONE.md"

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Retrieve the Verification Question (Priority: P1)

A Personal Agent can retrieve the verification Question provided by Big Question Club and reliably understand what it should answer.

**Why this priority**: Unless a Personal Agent can retrieve a Question, the product premise of participation through WebMCP cannot be verified.

**Independent Test**: Invoke the verification Tool once from a WebMCP-compatible Personal Agent and confirm that it receives one Question containing an identifier, body, and response language.

**Acceptance Scenarios**:

1. **Given** a Personal Agent can connect to the verification environment, **When** it invokes the verification Tool, **Then** it receives the specified fixed Question.
2. **Given** the same verification period, **When** it invokes the Tool repeatedly, **Then** it receives a Question with the same identifier, body, and language.
3. **Given** an Agent retrieved the Question, **When** it reads the returned content, **Then** it can determine the body to answer and the language in which to answer without additional information.

---

### User Story 2 - Reproduce the Connection Procedure (Priority: P2)

A developer can follow the defined procedure to start the verification environment, connect a Personal Agent, and reproduce Question retrieval.

**Why this priority**: Validating the concept requires a reproducible entry point that subsequent SPECs can reuse, not merely a one-time success.

**Independent Test**: Confirm that a developer unfamiliar with the project can retrieve the verification Question from a Personal Agent within 30 minutes using only the setup instructions.

**Acceptance Scenarios**:

1. **Given** a developer has the necessary access information, **When** they follow the documented procedure, **Then** they can make the verification environment available.
2. **Given** the verification environment is available, **When** they configure its destination in a Personal Agent, **Then** they can identify the destination and perform Question retrieval.

### Edge Cases

- If the destination is unavailable, the Agent or developer can recognize a retryable failure rather than an empty Question that appears successful.
- If the fixed Question's body or language is not configured, do not return it as a Question; treat it as invalid configuration.
- If unsupported input is passed to the Tool, reject it explicitly without changing the fixed Question content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide exactly one verification Question retrieval capability invokable by a Personal Agent.
- **FR-002**: During the verification period, the system MUST always return exactly one fixed Question.
- **FR-003**: The fixed Question MUST include a stable identifier, Question body, and primary language.
- **FR-004**: The fixed Question body MUST ask how people should prepare for a future in which AI increasingly automates work.
- **FR-005**: The system MUST NOT require login, personal information, or Personal Context transmission to use the Question retrieval capability.
- **FR-006**: When unavailable or incorrectly configured, the system MUST NOT return a response that could be mistaken for successful Question retrieval.
- **FR-007**: The system MUST provide a procedure that developers can follow to start the verification environment, connect to it, and confirm Question retrieval.
- **FR-008**: Within this SPEC's scope, the system MUST NOT provide Answer submission, user authentication, persistent data management, or delivery of multiple Questions.

### Key Entities

- **Verification Question**: The sole fixed response target returned to verify the WebMCP connection. It has an identifier, body, and primary language.
- **Question Retrieval Capability**: The public operation used by a Personal Agent to retrieve the verification Question.
- **Connection Verification Procedure**: The procedure a developer follows to make the verification environment available and reproduce Question retrieval from a Personal Agent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A supported Personal Agent can retrieve one verification Question within two minutes after the connection is configured.
- **SC-002**: Across ten consecutive Question retrievals from the same verification environment, every result has the same identifier, body, and primary language.
- **SC-003**: A developer using the documented procedure can start the verification environment and confirm Question retrieval by a Personal Agent within 30 minutes.
- **SC-004**: In checks simulating connection failure or invalid configuration, zero successful Questions are returned.

## Assumptions

- At least one type of WebMCP-compatible Personal Agent is available as a verification target.
- The verification Question's primary language is English; a subsequent SPEC verifies same-language responses, including Japanese.
- This SPEC covers only pre-authentication connectivity. Mapping WebMCP to a logged-in user is covered by SPEC 002.
- This SPEC does not constrain how fixed Question data is stored. Persistent Question management is covered by SPEC 005.

## Dependencies

- None. This SPEC is the first implementation target in the MVP milestone.

## Out of Scope

- Google OAuth and user identification
- Generating, posting, saving, or viewing Answers
- Use of Personal Context, safety, Prompt Injection, or response-language verification
- Question creation, publishing, deadlines, or Reveal
