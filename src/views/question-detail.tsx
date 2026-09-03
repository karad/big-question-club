import { createAgentRequestPrompt } from '../domain/agent-request-prompt';
import { createAnonymousParticipantVisual } from '../domain/anonymous-participant';
import {
  formatAnswerCount,
  getDeadlinePresentation,
  type ViewerPresentation,
} from '../domain/question-browsing';
import type { Question, QuestionState } from '../domain/question';
import type { OwnAnswerView, RevealedExcerptView } from '../repositories/question-repository';
import { DeleteQuestionForm } from './question-management';
import { Icon } from './icon';
import { SiteLayout } from './layout';
import { SubmissionStatus } from './submission-status';

export function AgentRequestSection({ questionUrl }: { questionUrl: string }) {
  return (
    <section class="paper-card" data-agent-request>
      <p class="eyebrow mb-2">Independent response</p>
      <h2 class="section-title">Ask your personal agent</h2>
      <p class="mt-3 text-ink-muted">
        Your answer will be public after the deadline. You can update or remove it before then.
      </p>
      <textarea
        class="mt-5 w-full rounded-xl border p-4 text-sm leading-6"
        readOnly
        rows={3}
        data-agent-request-prompt
      >
        {createAgentRequestPrompt(questionUrl)}
      </textarea>
      <button class="button-primary mt-3" type="button" data-copy-agent-prompt>
        <Icon name="copy" />
        Copy prompt
      </button>
      <p role="status" aria-live="polite" data-copy-agent-prompt-status />
    </section>
  );
}

export function OwnAnswer({ answer }: { answer: { body: string; excerpt: string } }) {
  return (
    <section class="paper-card" data-own-answer>
      <p class="eyebrow mb-2">Your submission</p>
      <h2 class="section-title">Your answer</h2>
      <p class="mt-4 font-semibold prose-safe">{answer.excerpt}</p>
      <p class="mt-3 prose-safe leading-7">{answer.body}</p>
    </section>
  );
}

export function RevealedAnswers({
  answers,
  questionId,
}: {
  answers: RevealedExcerptView[];
  questionId: string;
}) {
  if (answers.length === 0) return <p class="paper-card">No answers were submitted.</p>;
  return (
    <ol class="space-y-5">
      {answers.map(({ id, excerpt, isOwn }, index) => (
        <li class="paper-card" key={id}>
          <div class="flex items-center gap-3">
            <AnonymousParticipantIcon answerId={id} questionId={questionId} />
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-revealed">
                  Answer {index + 1}
                </p>
                {isOwn ? (
                  <span class="status-submission" data-own-answer-badge>
                    <Icon name="check" />
                    Your answer
                  </span>
                ) : null}
              </div>
              <p class="mt-0.5 text-sm text-ink-muted">Authenticated participant</p>
            </div>
          </div>
          <p class="mt-3 prose-safe text-lg font-semibold">{excerpt}</p>
          <button
            class="button-secondary mt-4"
            type="button"
            data-answer-id={id}
            data-question-id={questionId}
            aria-expanded="false"
            aria-controls={`answer-${id}`}
          >
            <Icon name="bookOpen" />
            Read full answer
          </button>
          <div
            class="prose-safe mt-4 border-t border-ink/15 pt-4 leading-7"
            id={`answer-${id}`}
            hidden
            role="region"
            aria-label={`Answer ${index + 1} full text`}
          />
        </li>
      ))}
    </ol>
  );
}

function AnonymousParticipantIcon({
  answerId,
  questionId,
}: {
  answerId: string;
  questionId: string;
}) {
  const visual = createAnonymousParticipantVisual(questionId, answerId);
  return (
    <svg
      class="size-11 shrink-0 rounded-xl"
      viewBox="0 0 5 5"
      aria-hidden="true"
      focusable="false"
      data-anonymous-participant-icon
    >
      <rect width="5" height="5" fill={visual.background} />
      {visual.cells.map(([x, y]) => (
        <rect x={x} y={y} width="1" height="1" fill={visual.foreground} key={`${x}-${y}`} />
      ))}
    </svg>
  );
}

export function QuestionDetailPage({
  answerCount,
  clientScriptUrl,
  excerpts,
  hasAnswered,
  isCreator,
  ownAnswer,
  question,
  questionUrl,
  snapshotNow,
  state,
  viewer,
}: {
  answerCount: number;
  clientScriptUrl: string;
  excerpts: RevealedExcerptView[];
  hasAnswered: boolean | null;
  isCreator: boolean;
  ownAnswer: OwnAnswerView | null;
  question: Question;
  questionUrl: string;
  snapshotNow: number;
  state: QuestionState;
  viewer: ViewerPresentation;
}) {
  const deadline = getDeadlinePresentation(question.closesAt, snapshotNow);
  return (
    <SiteLayout
      title="Question"
      clientScriptUrl={clientScriptUrl}
      page="question-detail"
      navigation={
        <>
          <a href="/">Home</a>
          <a href="/questions/open">Open questions</a>
          <a href="/questions/revealed">Results</a>
        </>
      }
    >
      <article data-question-detail data-question-state={state}>
        <header class="border-b border-line pb-10 pt-2 sm:pb-12">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class={state === 'REVEALED' ? 'status-revealed' : 'status-sealed'}
              data-sealed-status
            >
              <Icon
                name={state === 'REVEALED' ? 'unlock' : 'lock'}
                label={state === 'REVEALED' ? 'Results available' : 'Answers are sealed'}
              />
              {state === 'REVEALED' ? 'Results available' : 'Answers are sealed.'}
            </span>
            <SubmissionStatus hasAnswered={hasAnswered} />
          </div>
          <h1 class="editorial-title prose-safe mt-5">{question.body}</h1>
          <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span class="font-semibold text-sealed">
              Status: {state === 'REVEALED' ? 'Results available' : state}
            </span>
            <span class="inline-flex items-center gap-2" data-answer-count>
              <Icon name="users" />
              Answers submitted: {answerCount} ({formatAnswerCount(answerCount)})
            </span>
            <span class="inline-flex items-center gap-2">
              <Icon name="clock" />
              <time dateTime={deadline.absolute}>{deadline.absoluteLabel}</time>
            </span>
            <span class="font-semibold" data-time-remaining>
              {deadline.remainingLabel}
            </span>
          </div>
          {isCreator ? (
            <p class="mt-4 font-semibold" data-question-creator>
              You created this question.
            </p>
          ) : null}
        </header>
        <div class="mt-10 space-y-10">
          <ViewerSection
            ownAnswer={ownAnswer}
            questionUrl={questionUrl}
            state={state}
            viewer={viewer}
          />
          {state === 'REVEALED' && viewer === 'closed' ? (
            <section data-revealed-answers>
              <div class="mb-5">
                <p class="eyebrow">The seal is open</p>
                <h2 class="section-title mt-2">Independent answers</h2>
                <p class="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
                  All answers were submitted by signed-in participants. One answer per account.
                </p>
              </div>
              <RevealedAnswers answers={excerpts} questionId={question.id} />
            </section>
          ) : null}
          {isCreator ? <DeleteQuestionForm question={question} /> : null}
        </div>
      </article>
    </SiteLayout>
  );
}

function ViewerSection({
  ownAnswer,
  questionUrl,
  state,
  viewer,
}: {
  ownAnswer: OwnAnswerView | null;
  questionUrl: string;
  state: QuestionState;
  viewer: ViewerPresentation;
}) {
  if (viewer === 'submission-unavailable')
    return (
      <section class="paper-card" data-viewer-state="submission-unavailable">
        <p>Your submission status is temporarily unavailable. Try again.</p>
      </section>
    );
  if (viewer === 'anonymous')
    return (
      <section class="paper-card" data-viewer-state="anonymous">
        <p>
          {state === 'REVEALED'
            ? 'Sign in to view results.'
            : state === 'CLOSED'
              ? 'Sign in to view your submission.'
              : 'Sign in to answer with your personal agent.'}
        </p>
        <p class="mt-3 text-sm text-ink-muted">Use Sign in with Google in the header.</p>
      </section>
    );
  if (viewer === 'authenticated-unsubmitted')
    return <AgentRequestSection questionUrl={questionUrl} />;
  if (viewer === 'authenticated-submitted' && ownAnswer !== null)
    return (
      <section data-viewer-state="authenticated-submitted">
        <p class="status-sealed">
          <Icon name="check" />
          Your agent has answered. Your answer remains sealed until the deadline.
        </p>
        <div class="mt-5">
          <OwnAnswer answer={ownAnswer} />
        </div>
      </section>
    );
  return (
    <section data-viewer-state="closed">
      {state === 'CLOSED' ? (
        <p class="status-sealed" data-agent-request-unavailable>
          <Icon name="lock" />
          Answer submissions are closed. Answers remain sealed until reveal.
        </p>
      ) : null}
      {state === 'CLOSED' && ownAnswer !== null ? (
        <div class="mt-5">
          <OwnAnswer answer={ownAnswer} />
        </div>
      ) : null}
    </section>
  );
}
