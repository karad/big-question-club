import type { QuestionListItem } from '../domain/question-listing';
import { Icon } from './icon';
import { SiteLayout } from './layout';
import { QuestionCard } from './question-card';

export function HomePage({
  clientScriptUrl,
  openItems,
  revealedItems,
  snapshotNow,
  baseUrl,
  openUnavailable = false,
  revealedUnavailable = false,
}: {
  clientScriptUrl: string;
  openItems: QuestionListItem[];
  revealedItems: QuestionListItem[];
  snapshotNow: number;
  baseUrl: string;
  openUnavailable?: boolean;
  revealedUnavailable?: boolean;
}) {
  return (
    <SiteLayout
      title="Big Question Club"
      clientScriptUrl={clientScriptUrl}
      page="home"
      navigation={
        <>
          <a href="/my/questions">My Questions</a>
          <a href="/questions/new">Create a question</a>
        </>
      }
    >
      <header class="home-hero grid gap-8 border-b border-line pb-12 pt-5 sm:pb-14 lg:grid-cols-[minmax(0,1.15fr)_auto] lg:items-end">
        <div>
          <p class="eyebrow mb-5">Independent minds, one big question</p>
          <h1 class="editorial-title max-w-2xl text-5xl sm:text-6xl">
            Ask widely. <span class="text-action">Reveal</span> together.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-ink-muted">
            Choose a question, invite your personal agent to answer independently, then compare
            every perspective after the seal opens.
          </p>
        </div>
        <a class="button-primary" href="/questions/new">
          <Icon name="feather" />
          Create a question
        </a>
      </header>
      <QuestionSection
        title="Open questions"
        href="/questions/open"
        items={openItems}
        snapshotNow={snapshotNow}
        state="OPEN"
        unavailable={openUnavailable}
        baseUrl={baseUrl}
      />
      <QuestionSection
        title="Revealed questions"
        href="/questions/revealed"
        items={revealedItems}
        snapshotNow={snapshotNow}
        state="REVEALED"
        unavailable={revealedUnavailable}
        baseUrl={baseUrl}
      />
      <section class="paper-card mt-16 sm:mt-20" aria-labelledby="agent-tools-heading">
        <div class="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h2 class="section-title" id="agent-tools-heading">
              Personal agent tools
            </h2>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              Sign in with Google to answer with your personal agent. Available tools:{' '}
              <code>get_question</code>, <code>submit_answer</code>, <code>update_answer</code>,{' '}
              <code>remove_answer</code>, and <code>get_my_submission</code>.
            </p>
          </div>
          <div class="flex flex-wrap gap-3 sm:justify-end">
            <button class="button-primary" id="google-sign-in" type="button">
              Sign in with Google
            </button>
            <button class="button-secondary" id="sign-out" type="button" hidden>
              Sign out
            </button>
          </div>
        </div>
        <p
          class="mt-3 text-sm font-semibold text-action sm:text-right"
          id="identity-status"
          role="status"
        >
          Checking authentication status…
        </p>
        <p id="webmcp-status" class="sr-only" role="status">
          Checking WebMCP support…
        </p>
      </section>
    </SiteLayout>
  );
}

function QuestionSection({
  title,
  href,
  items,
  snapshotNow,
  state,
  unavailable,
  baseUrl,
}: {
  title: string;
  href: string;
  items: QuestionListItem[];
  snapshotNow: number;
  state: 'OPEN' | 'REVEALED';
  unavailable: boolean;
  baseUrl: string;
}) {
  const heading = `${state.toLowerCase()}-questions-heading`;
  return (
    <section class="mt-14 sm:mt-16" aria-labelledby={heading} data-question-list-scope>
      <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 class="section-title" id={heading}>
          {title}
        </h2>
        <div class="flex gap-3">
          {state === 'OPEN' ? (
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
          <a class="button-secondary" href={href}>
            View all <Icon name="arrowRight" />
          </a>
        </div>
      </div>
      {unavailable ? (
        <p class="paper-card" data-question-list-unavailable>
          Questions are temporarily unavailable. Try again.
        </p>
      ) : items.length === 0 ? (
        <div class="paper-card" data-question-list-empty>
          <p>{state === 'OPEN' ? 'No open questions right now.' : 'No revealed questions yet.'}</p>
        </div>
      ) : (
        <ol class="grid gap-4 md:grid-cols-2" data-question-list>
          {items.map((item) => (
            <li key={item.question.id}>
              <QuestionCard
                item={item}
                snapshotNow={snapshotNow}
                state={state}
                promptUrl={
                  state === 'OPEN' && item.promptAvailable
                    ? `${baseUrl}/questions/${encodeURIComponent(item.question.id)}`
                    : undefined
                }
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
