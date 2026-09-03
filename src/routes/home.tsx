import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import type { QuestionListItem } from '../domain/question-listing';
import type { OpenQuestionSummary, QuestionRepository } from '../repositories/question-repository';
import { HomePage } from '../views/home';
import { PRIVATE_RESPONSE_HEADERS } from './question';

export async function homeRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const snapshotNow = now();
  const baseUrl = new URL(context.req.url).origin;
  if (repository === undefined)
    return context.html(
      <HomePage
        clientScriptUrl={clientScriptUrl}
        openItems={[]}
        revealedItems={[]}
        snapshotNow={snapshotNow}
        baseUrl={baseUrl}
      />,
      200,
      PRIVATE_RESPONSE_HEADERS,
    );
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  const userId = 'code' in identity ? undefined : identity.userId;
  const [openResult, revealedResult] = await Promise.allSettled([
    repository.listOpenQuestions(snapshotNow, 5),
    repository.listRevealedQuestions(snapshotNow, 10),
  ]);
  const open = openResult.status === 'fulfilled' ? openResult.value : [];
  const revealed = revealedResult.status === 'fulfilled' ? revealedResult.value : [];
  let answered: Set<string> | null = userId === undefined ? null : new Set<string>();
  const visibleQuestionIds = [...open, ...revealed].map(({ question }) => question.id);
  if (userId !== undefined && visibleQuestionIds.length > 0) {
    try {
      answered = new Set(await repository.listOwnAnsweredQuestionIds(visibleQuestionIds, userId));
    } catch {
      return context.html(
        <HomePage
          clientScriptUrl={clientScriptUrl}
          openItems={[]}
          revealedItems={toItems(revealed, null, false)}
          snapshotNow={snapshotNow}
          baseUrl={baseUrl}
          openUnavailable
          revealedUnavailable={revealedResult.status === 'rejected'}
        />,
        503,
        PRIVATE_RESPONSE_HEADERS,
      );
    }
  }
  const status =
    openResult.status === 'rejected' && revealedResult.status === 'rejected' ? 503 : 200;
  return context.html(
    <HomePage
      clientScriptUrl={clientScriptUrl}
      openItems={toItems(open, answered, userId !== undefined)}
      revealedItems={toItems(revealed, answered, false)}
      snapshotNow={snapshotNow}
      baseUrl={baseUrl}
      openUnavailable={openResult.status === 'rejected'}
      revealedUnavailable={revealedResult.status === 'rejected'}
    />,
    status,
    PRIVATE_RESPONSE_HEADERS,
  );
}

function toItems(
  items: OpenQuestionSummary[],
  answered: Set<string> | null,
  promptAvailable: boolean,
): QuestionListItem[] {
  return items.map(({ question, answerCount }) => ({
    question,
    answerCount,
    hasAnswered: answered?.has(question.id) ?? null,
    promptAvailable,
  }));
}
