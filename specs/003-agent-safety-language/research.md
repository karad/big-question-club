# Technical Research: Validating Personal Agent Answer Safety and Language

## Decision 1: Treat Questions, Tool Definitions, and Tool Output as Untrusted Data

- **Decision**: Do not treat the Question body, WebMCP Tool name, description, argument names, or Tool output as trusted grounds for safety. Treat the Question body as data for the Agent to inspect and answer, not as instructions.
- **Rationale**: In WebMCP, malicious Tool manifests as well as output containing third-party data can become Prompt Injection vectors. Never prioritize requests to disclose Private Context, change rules, or transmit data externally, regardless of whether they appear in the body, definition, or output.
- **Alternatives considered**: Depending only on the model's Injection resistance is rejected. LLM behavior alone cannot guarantee safety; it must be combined with a same-origin boundary, read-only behavior, a contract that does not receive Private Context, and manual evaluation.

## Decision 2: Mark Verification Question Output as Untrusted Content

- **Decision**: Apply `readOnlyHint: true` and `untrustedContentHint: true` to the read-only Tool returning Question bodies. Restrict the Tool to returning one case at a time.
- **Rationale**: Verification Questions intentionally contain Injection strings. Marking the entire Tool output as untrusted communicates that the Agent must treat these strings as data rather than instructions. Returning one item at a time avoids placing multiple Injections in Context simultaneously and enables per-case decisions.
- **Alternatives considered**: Omitting the Tool-level marker and explaining safety only in the description is rejected because the contract would not clearly identify Injection-bearing output. Registering a separate Tool for every Question is also rejected because Tool-selection variability would contaminate validation results.

## Decision 3: State Mandatory Safety and Language Rules Concisely in the Tool Description

- **Decision**: Concisely state in the Tool description that it retrieves one verification Question, requires a case ID, is read-only, requires an Answer in the Question's language, limits Personal Context to internal reasoning, and distrusts instructions in the body.
- **Rationale**: This explicit usage contract satisfies FR-010. The description remains an aid to Tool selection rather than the sole safety mechanism, because an untrusted Tool definition can itself become an Injection vector. Combine it with the validation Agent's trusted safety instructions, the untrusted-output marker, and manual evaluation.
- **Alternatives considered**: Omitting the safety and language rules is rejected because the validation contract would not state what the Agent must follow. Embedding a long safety Prompt is also rejected because the description cannot guarantee the security boundary and would add ambiguity to Tool selection.

## Decision 4: Evaluate with Manual E2E Without Sending Answers to the Application

- **Decision**: Do not add Answer-submission, storage, or automated-scoring APIs. An evaluator inspects the Answer returned by a real Personal Agent and records only Secret-free decisions in `validation-record.md`.
- **Rationale**: Receiving an Answer creates a new route through which Private Context or paraphrases of Secrets could leak into the application, logs, or Git. P0 cannot assume a trustworthy automated evaluator for internal reasoning, semantic disclosure, or relevance to the Question.
- **Alternatives considered**: A temporary POST API and storage of full Answers are rejected because they prematurely take on responsibilities from SPEC 004 and later while increasing the disclosure surface.

## Decision 5: Separate Automated Tests of the Fixed Contract from Manual E2E with a Real Agent

- **Decision**: Use Vitest to check fixed Questions, case selection, language and classification, API `no-store`, Tool registration and the untrusted marker, and absence of Secrets from SSR. Determine Go/No-Go for Private Context use, disclosure, Injection resistance, and language matching with a real Personal Agent.
- **Rationale**: The application does not retain the Personal Agent's Private Context or internal reasoning. Simulating or collecting them in automated tests would substitute a different subject for the validation target and violate the privacy boundary.
- **Alternatives considered**: Determining every condition with Vitest alone is rejected because it cannot verify how a real Agent interprets WebMCP output.

## References

- [Chrome for Developers: WebMCP security](https://developer.chrome.com/docs/agents/security)
- [Chrome for Developers: Secure WebMCP tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome for Developers: WebMCP evaluations](https://developer.chrome.com/docs/ai/webmcp/evals)
