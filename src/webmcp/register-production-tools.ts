import { registerGetQuestionTool } from './register-get-question-tool';
import { registerMySubmissionTool } from './register-my-submission-tool';
import { registerRemoveAnswerTool } from './register-remove-answer-tool';
import { registerSubmitAnswerTool } from './register-submit-answer-tool';
import { registerUpdateAnswerTool } from './register-update-answer-tool';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Registration = { registered: true } | { registered: false; message: string };

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
