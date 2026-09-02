import { createAgentRequestPrompt } from '../domain/agent-request-prompt';
import {
  formatAnswerCount,
  getDeadlinePresentation,
  type ViewerPresentation,
} from '../domain/question-browsing';
import type { Question, QuestionState } from '../domain/question';
import type { OwnAnswerView, RevealedExcerptView } from '../repositories/question-repository';
import { SiteHeader } from './site-header';

export function AgentRequestSection({ questionUrl }: { questionUrl: string }) {
  return (
    <section data-agent-request>
      <h2>Ask your personal agent</h2>
      <p>
        Your answer will be public. You can update or remove it until the answer deadline. After the
        deadline, it cannot be changed.
      </p>
      <textarea readOnly rows={2} data-agent-request-prompt>
        {createAgentRequestPrompt(questionUrl)}
      </textarea>
      <p>
        <button type="button" data-copy-agent-prompt>
          Copy prompt
        </button>
      </p>
      <p role="status" aria-live="polite" data-copy-agent-prompt-status />
    </section>
  );
}

export function OwnAnswer({ answer }: { answer: { body: string; excerpt: string } }) {
  return (
    <section data-own-answer>
      <h2>Your answer</h2>
      <p>{answer.excerpt}</p>
      <p>{answer.body}</p>
    </section>
  );
}

export function RevealedAnswers({ answers }: { answers: RevealedExcerptView[] }) {
  if (answers.length === 0) return <li>No answers have been submitted.</li>;
  return (
    <>
      {answers.map(({ id, excerpt }) => (
        <li key={id}>
          <button type="button" data-answer-id={id}>
            {excerpt}
          </button>
          <p id={`answer-${id}`} hidden />
        </li>
      ))}
    </>
  );
}

export function QuestionDetailPage({
  answerCount,
  clientScriptUrl,
  excerpts,
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Question | Big Question Club</title>
      </head>
      <body>
        <SiteHeader navigationLabel="Question navigation">
          <a href="/">Back to open questions</a>
        </SiteHeader>
        <main data-page="question-detail" data-question-state={state}>
          <article data-question-detail>
            <h1>{question.body}</h1>
            <dl>
              <dt>Status</dt>
              <dd>Status: {state}</dd>
              <dt>Answers</dt>
              <dd>
                Answers submitted: {answerCount}{' '}
                <span data-answer-count>({formatAnswerCount(answerCount)})</span>
              </dd>
              <dt>Deadline</dt>
              <dd>
                <time dateTime={deadline.absolute}>{deadline.absolute}</time>
              </dd>
              <dt>Time remaining</dt>
              <dd data-time-remaining>{deadline.remainingLabel}</dd>
            </dl>
            {isCreator ? <p data-question-creator>You created this question.</p> : null}
            <SealedStatus state={state} />
            <ViewerSection
              ownAnswer={ownAnswer}
              questionUrl={questionUrl}
              state={state}
              viewer={viewer}
            />
            {state === 'REVEALED' && viewer === 'closed' ? (
              <section data-revealed-answers>
                <h2>Answers</h2>
                <ul>
                  <RevealedAnswers answers={excerpts} />
                </ul>
              </section>
            ) : null}
          </article>
        </main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}

function SealedStatus({ state }: { state: QuestionState }) {
  if (state === 'REVEALED') return <p data-sealed-status>Answers are available.</p>;
  if (state === 'CLOSED') {
    return (
      <>
        <p data-sealed-status>Answers are sealed.</p>
        <p>Answers remain sealed until reveal.</p>
      </>
    );
  }
  return (
    <>
      <p data-sealed-status>Answers are sealed.</p>
      <p>Independent answers stay private until the deadline.</p>
    </>
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
  if (viewer === 'submission-unavailable') {
    return (
      <section data-viewer-state="submission-unavailable">
        <p>Your submission status is temporarily unavailable. Try again.</p>
      </section>
    );
  }
  if (viewer === 'anonymous') {
    const message =
      state === 'REVEALED'
        ? 'Sign in to view revealed answers.'
        : state === 'CLOSED'
          ? 'Sign in to view your submission.'
          : 'Sign in to answer with your personal agent.';
    return (
      <section data-viewer-state="anonymous">
        <p>{message}</p>
        <button id="google-sign-in" type="button">
          Sign in with Google
        </button>
        <p id="identity-status" role="status">
          Sign in to identify your account.
        </p>
      </section>
    );
  }
  if (viewer === 'authenticated-unsubmitted') {
    return <AgentRequestSection questionUrl={questionUrl} />;
  }
  if (viewer === 'authenticated-submitted' && ownAnswer !== null) {
    return (
      <section data-viewer-state="authenticated-submitted">
        <p>Your agent has answered.</p>
        <p>Your answer remains sealed until the deadline.</p>
        <OwnAnswer answer={ownAnswer} />
      </section>
    );
  }
  return (
    <section data-viewer-state="closed">
      <p data-agent-request-unavailable>Answer submissions are closed.</p>
      {state === 'CLOSED' && ownAnswer !== null ? <OwnAnswer answer={ownAnswer} /> : null}
    </section>
  );
}
