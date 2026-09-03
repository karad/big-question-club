import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import {
  createQuestionListPage,
  parsePage,
  QUESTION_PAGE_SIZE,
  type QuestionListItem,
  type QuestionListKind,
} from '../domain/question-listing';
import type { QuestionRepository } from '../repositories/question-repository';
import { QuestionListPageView } from '../views/question-list';
import { PRIVATE_RESPONSE_HEADERS } from './question';

export async function questionListRoute(
  context: Context,
  kind: QuestionListKind,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  if (repository === undefined)
    return context.text(
      'Questions are temporarily unavailable. Try again.',
      503,
      PRIVATE_RESPONSE_HEADERS,
    );
  const snapshotNow = now();
  const page = parsePage(context.req.query('page'));
  const offset = (page - 1) * QUESTION_PAGE_SIZE;
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  const userId = 'code' in identity ? undefined : identity.userId;
  try {
    const [summaries, totalItems] = await Promise.all(
      kind === 'open'
        ? [
            repository.listOpenQuestions(snapshotNow, QUESTION_PAGE_SIZE, offset),
            repository.countOpenQuestions(snapshotNow),
          ]
        : [
            repository.listRevealedQuestions(snapshotNow, QUESTION_PAGE_SIZE, offset),
            repository.countRevealedQuestions(snapshotNow),
          ],
    );
    const answered =
      userId !== undefined
        ? new Set(
            await repository.listOwnAnsweredQuestionIds(
              summaries.map(({ question }) => question.id),
              userId,
            ),
          )
        : null;
    const items: QuestionListItem[] = summaries.map(({ question, answerCount }) => ({
      question,
      answerCount,
      hasAnswered: answered?.has(question.id) ?? null,
      promptAvailable: userId !== undefined && kind === 'open',
    }));
    return context.html(
      <QuestionListPageView
        clientScriptUrl={clientScriptUrl}
        kind={kind}
        result={createQuestionListPage(items, totalItems, page)}
        snapshotNow={snapshotNow}
        baseUrl={new URL(context.req.url).origin}
      />,
      200,
      PRIVATE_RESPONSE_HEADERS,
    );
  } catch {
    return context.text(
      'Questions are temporarily unavailable. Try again.',
      503,
      PRIVATE_RESPONSE_HEADERS,
    );
  }
}
