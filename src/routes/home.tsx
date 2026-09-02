import type { Context } from 'hono';
import type { QuestionRepository } from '../repositories/question-repository';
import { HomePage } from '../views/home';

export async function homeRoute(
  context: Context,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const snapshotNow = now();
  if (repository === undefined) {
    return context.html(
      <HomePage clientScriptUrl={clientScriptUrl} items={[]} snapshotNow={snapshotNow} />,
    );
  }
  try {
    const items = await repository.listOpenQuestions(snapshotNow);
    return context.html(
      <HomePage clientScriptUrl={clientScriptUrl} items={items} snapshotNow={snapshotNow} />,
    );
  } catch {
    return context.html(
      <HomePage
        clientScriptUrl={clientScriptUrl}
        items={[]}
        snapshotNow={snapshotNow}
        unavailable
      />,
      503,
    );
  }
}
