import { createAgentRequestPrompt } from '../domain/agent-request-prompt';
import { formatAnswerCount, getDeadlinePresentation } from '../domain/question-browsing';
import type { QuestionListItem } from '../domain/question-listing';
import type { QuestionState } from '../domain/question';
import { Icon } from './icon';

export function QuestionCard({
  item,
  snapshotNow,
  state,
  promptUrl,
}: {
  item: QuestionListItem;
  snapshotNow: number;
  state: QuestionState;
  promptUrl?: string | undefined;
}) {
  const { question, answerCount, hasAnswered } = item;
  const deadline = getDeadlinePresentation(question.closesAt, snapshotNow);
  const panelId = `prompt-${question.id}`;
  return (
    <article
      class="paper-card flex h-full flex-col gap-4 transition hover:-translate-y-0.5 hover:border-action/35 hover:shadow-[0_5px_18px_rgba(100,50,10,0.08)]"
      data-question-card
      data-question-state={state}
    >
      <span class={state === 'REVEALED' ? 'status-revealed' : 'status-sealed'} data-sealed-status>
        <Icon
          name={state === 'REVEALED' ? 'unlock' : 'lock'}
          label={state === 'REVEALED' ? 'Answers are revealed' : 'Answers are sealed'}
        />
        {state === 'REVEALED' ? 'Answers revealed' : 'Answers are sealed'}
      </span>
      <h3 class="prose-safe font-display text-xl font-bold leading-snug tracking-[-0.01em]">
        {question.body}
      </h3>
      <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
        <span class="inline-flex items-center gap-2" data-answer-count>
          <Icon name="users" />
          {formatAnswerCount(answerCount)}
        </span>
        {state === 'OPEN' ? (
          <span class="inline-flex items-center gap-2" data-deadline-pair>
            <Icon name="clock" />
            <span class="sr-only">Time remaining: </span>
            <span data-time-remaining>{deadline.remainingLabel}</span>
            <span class="sr-only">Deadline: </span>
            <time hidden data-time-absolute dateTime={deadline.absolute}>
              {deadline.absoluteLabel}
            </time>
          </span>
        ) : null}
      </div>
      {state === 'OPEN' && promptUrl !== undefined && !hasAnswered ? (
        <div>
          <button
            class="button-secondary"
            type="button"
            data-toggle-agent-prompt={panelId}
            aria-expanded="false"
            aria-controls={panelId}
          >
            <Icon name="feather" />
            Ask your personal agent
          </button>
          <div id={panelId} hidden class="mt-3 rounded-xl bg-paper-deep p-4" data-agent-request>
            <textarea
              class="w-full rounded-lg border border-ink/20 bg-white p-3"
              readOnly
              rows={3}
              data-agent-request-prompt
            >
              {createAgentRequestPrompt(promptUrl)}
            </textarea>
            <button class="button-secondary mt-3" type="button" data-copy-agent-prompt>
              <Icon name="copy" />
              Copy prompt
            </button>
            <p role="status" aria-live="polite" data-copy-agent-prompt-status />
          </div>
        </div>
      ) : state === 'OPEN' && hasAnswered ? (
        <p class="text-sm font-semibold text-revealed">
          <Icon name="check" /> Your agent has answered.
        </p>
      ) : null}
      <a
        class="mt-auto inline-flex items-center gap-1 font-semibold"
        href={`/questions/${encodeURIComponent(question.id)}`}
      >
        View question <Icon name="arrowRight" />
      </a>
    </article>
  );
}
