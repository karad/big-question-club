import { answerError, type AnswerError } from '../domain/answer-submission';
import { getWebMcpSupport } from './browser-support';
import { questionIdSchema, registrationFailure } from './register-get-question-tool';
import { parseQuestionIdInput } from './tool-input';

/** Public WebMCP name for removing the viewer's answer. */
export const REMOVE_ANSWER_TOOL_NAME = 'remove_answer';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Executes an answer removal against the application endpoint.
 * @param input - Untrusted tool input.
 * @param signal - Abort signal supplied by the WebMCP runtime.
 * @param fetchLike - Fetch implementation used for the request.
 * @param endpoint - Answer-removal endpoint base path.
 * @returns The parsed endpoint payload or a structured answer error.
 */
export async function executeRemoveAnswerTool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/questions',
): Promise<unknown | AnswerError> {
  const parsed = parseQuestionIdInput(input);
  if ('code' in parsed) return parsed;
  if (signal?.aborted) return answerError('TOOL_UNAVAILABLE');
  try {
    const response = await fetchLike(
      `${endpoint}/${encodeURIComponent(parsed.questionId)}/my-answer`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        ...(signal === undefined ? {} : { signal }),
      },
    );
    return await response.json();
  } catch {
    return answerError('TOOL_UNAVAILABLE');
  }
}

/**
 * Registers the answer-removal WebMCP tool when browser support is available.
 * @param documentLike - Document-like object that exposes the model context.
 * @param fetchLike - Fetch implementation used by the tool.
 * @returns The registration outcome.
 */
export async function registerRemoveAnswerTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);
  if (!support.available) return { registered: false, message: support.message };
  try {
    await support.modelContext.registerTool({
      name: REMOVE_ANSWER_TOOL_NAME,
      description:
        "Only when the human explicitly asks, permanently remove the current user's answer before its deadline.",
      inputSchema: questionIdSchema(),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, options) => executeRemoveAnswerTool(input, options?.signal, fetchLike),
    });
    return { registered: true };
  } catch {
    return registrationFailure();
  }
}
