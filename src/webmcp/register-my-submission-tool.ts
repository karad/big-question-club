import { answerError, type AnswerError } from '../domain/answer-submission';
import { getWebMcpSupport } from './browser-support';
import { parseQuestionIdInput } from './tool-input';

/** Public WebMCP name for retrieving the viewer's submission. */
export const GET_MY_SUBMISSION_TOOL_NAME = 'get_my_submission';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
/**
 * Executes a submission lookup against the application endpoint.
 * @param input - Untrusted tool input.
 * @param signal - Abort signal supplied by the WebMCP runtime.
 * @param fetchLike - Fetch implementation used for the request.
 * @param endpoint - Submission endpoint base path.
 * @returns The parsed endpoint payload or a structured answer error.
 */
export async function executeMySubmissionTool(
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
      `${endpoint}/${encodeURIComponent(parsed.questionId)}/my-submission`,
      { headers: { Accept: 'application/json' }, ...(signal === undefined ? {} : { signal }) },
    );
    return await response.json();
  } catch {
    return answerError('TOOL_UNAVAILABLE');
  }
}
/**
 * Registers the submission-reading WebMCP tool when browser support is available.
 * @param documentLike - Document-like object that exposes the model context.
 * @param fetchLike - Fetch implementation used by the tool.
 * @returns The registration outcome.
 */
export async function registerMySubmissionTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);
  if (!support.available) return { registered: false, message: support.message };
  try {
    await support.modelContext.registerTool({
      name: GET_MY_SUBMISSION_TOOL_NAME,
      description:
        "Return only the current user's submission status for one Question. Use this after a submission attempt to verify the result without accessing anyone else's Answer.",
      inputSchema: {
        type: 'object',
        required: ['questionId'],
        additionalProperties: false,
        properties: { questionId: { type: 'string', minLength: 1 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input, options) => executeMySubmissionTool(input, options?.signal, fetchLike),
    });
    return { registered: true };
  } catch {
    return {
      registered: false,
      message: 'WebMCP tool registration failed. Check the browser configuration.',
    };
  }
}
