import { registerGetQuestionTool } from './register-get-question-tool';
import { registerMySubmissionTool } from './register-my-submission-tool';
import { registerRemoveAnswerTool } from './register-remove-answer-tool';
import { registerSubmitAnswerTool } from './register-submit-answer-tool';
import { registerUpdateAnswerTool } from './register-update-answer-tool';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Registration = { registered: true } | { registered: false; message: string };

/**
 * Registers every production WebMCP tool supported by the current browser.
 * @param documentLike - Document-like object that exposes the model context.
 * @param fetchLike - Fetch implementation used by registered tools.
 * @returns Registration outcomes for all production tools.
 */
export async function registerProductionWebMcpTools(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<Registration[]> {
  return [
    await registerGetQuestionTool(documentLike, fetchLike),
    await registerSubmitAnswerTool(documentLike, fetchLike),
    await registerUpdateAnswerTool(documentLike, fetchLike),
    await registerRemoveAnswerTool(documentLike, fetchLike),
    await registerMySubmissionTool(documentLike, fetchLike),
  ];
}
