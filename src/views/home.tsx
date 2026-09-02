import { formatAnswerCount, getDeadlinePresentation } from '../domain/question-browsing';
import type { OpenQuestionSummary } from '../repositories/question-repository';
import { SiteHeader } from './site-header';

export function HomePage({
  clientScriptUrl,
  items,
  snapshotNow,
  unavailable = false,
}: {
  clientScriptUrl: string;
  items: OpenQuestionSummary[];
  snapshotNow: number;
  unavailable?: boolean;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Big Question Club</title>
      </head>
      <body>
        <SiteHeader navigationLabel="Account and question navigation">
          <a href="/questions/new">Create a question</a> <a href="/my/questions">My Questions</a>
        </SiteHeader>
        <main data-page="home">
          <h1>Big Question Club</h1>
          <p>Choose a question yourself, then ask your personal agent to answer it.</p>

          <section aria-labelledby="open-questions-heading">
            <h2 id="open-questions-heading">Open questions</h2>
            {unavailable ? (
              <p data-question-list-unavailable>
                Questions are temporarily unavailable. Try again.
              </p>
            ) : items.length === 0 ? (
              <div data-question-list-empty>
                <p>No open questions right now.</p>
                <p>Create a question or sign in to take part.</p>
              </div>
            ) : (
              <ol data-question-list>
                {items.map(({ question, answerCount }) => {
                  const deadline = getDeadlinePresentation(question.closesAt, snapshotNow);
                  return (
                    <li data-question-card data-question-state="OPEN" key={question.id}>
                      <article>
                        <h3>{question.body}</h3>
                        <dl>
                          <dt>Answers</dt>
                          <dd data-answer-count>{formatAnswerCount(answerCount)}</dd>
                          <dt>Deadline</dt>
                          <dd>
                            <time dateTime={deadline.absolute}>{deadline.absolute}</time>
                          </dd>
                          <dt>Time remaining</dt>
                          <dd data-time-remaining>{deadline.remainingLabel}</dd>
                        </dl>
                        <p data-sealed-status>Answers are sealed</p>
                        <p>
                          <a href={`/questions/${encodeURIComponent(question.id)}`}>
                            View question
                          </a>
                        </p>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section aria-labelledby="agent-tools-heading">
            <h2 id="agent-tools-heading">Personal agent tools</h2>
            <p>Sign in with Google to use the five answer tools with your personal agent.</p>
            <p>
              Available tools: <code>get_question</code>, <code>submit_answer</code>,{' '}
              <code>update_answer</code>, <code>remove_answer</code>, and{' '}
              <code>get_my_submission</code>.
            </p>
            <button id="google-sign-in" type="button">
              Sign in with Google
            </button>
            <button id="sign-out" type="button" hidden>
              Sign out
            </button>
            <p id="identity-status" role="status">
              Checking authentication status…
            </p>
            <p id="webmcp-status" role="status">
              Checking WebMCP support…
            </p>
          </section>
        </main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}
