import type { QuestionListKind, QuestionListPage } from '../domain/question-listing';
import { Icon } from './icon';
import { SiteLayout } from './layout';
import { QuestionCard } from './question-card';

/**
 * Renders a paginated list of open or revealed questions.
 * @param props - List category, page data, time snapshot, URLs, and client bundle.
 * @returns Question-list page markup.
 */
export function QuestionListPageView({
  clientScriptUrl,
  kind,
  result,
  snapshotNow,
  baseUrl,
}: {
  clientScriptUrl: string;
  kind: QuestionListKind;
  result: QuestionListPage;
  snapshotNow: number;
  baseUrl: string;
}) {
  const open = kind === 'open';
  const title = open ? 'Open questions' : 'Results';
  return (
    <SiteLayout
      title={title}
      clientScriptUrl={clientScriptUrl}
      page="question-list"
      navigation={
        <>
          <a href="/">Home</a>
          <a href="/questions/new">Create a question</a>
          <a href="/my/questions">My Questions</a>
        </>
      }
    >
      <section class="pt-2" data-question-list-scope>
        <header class="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
          <div>
            <p class="eyebrow">Browse the club</p>
            <h1 class="editorial-title mt-2">{title}</h1>
          </div>
          {open ? (
            <button
              class="button-secondary"
              type="button"
              data-toggle-deadlines
              aria-pressed="false"
            >
              <Icon name="clock" />
              Toggle deadlines
            </button>
          ) : null}
        </header>
        {result.items.length === 0 ? (
          <div class="paper-card">
            <p>{open ? 'No open questions on this page.' : 'No results on this page.'}</p>
            {result.page > 1 ? <a href={`/questions/${kind}`}>Go to page 1</a> : null}
          </div>
        ) : (
          <ol class="grid gap-4 md:grid-cols-2" data-question-list>
            {result.items.map((item) => (
              <li key={item.question.id}>
                <QuestionCard
                  item={item}
                  snapshotNow={snapshotNow}
                  state={open ? 'OPEN' : 'REVEALED'}
                  promptUrl={
                    open && item.promptAvailable
                      ? `${baseUrl}/questions/${encodeURIComponent(item.question.id)}`
                      : undefined
                  }
                />
              </li>
            ))}
          </ol>
        )}
        <nav class="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
          {result.page > 1 ? (
            <a class="button-secondary" href={`/questions/${kind}?page=${result.page - 1}`}>
              <Icon name="arrowLeft" />
              Previous
            </a>
          ) : (
            <span />
          )}
          <p class="text-sm font-semibold tabular-nums">
            Page {result.page} of {result.totalPages}
          </p>
          {result.page < result.totalPages ? (
            <a class="button-secondary" href={`/questions/${kind}?page=${result.page + 1}`}>
              Next
              <Icon name="arrowRight" />
            </a>
          ) : (
            <span />
          )}
        </nav>
      </section>
    </SiteLayout>
  );
}
