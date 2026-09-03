import { renderToString } from 'hono/jsx/dom/server';
import { describe, expect, it } from 'vitest';
import { QuestionCard } from '../../src/views/question-card';
import { openQuestion } from '../helpers/question-repository';

describe('QuestionCard', () => {
  it('limits open-question navigation to the View question button', () => {
    const html = renderToString(
      QuestionCard({
        item: {
          question: openQuestion,
          answerCount: 0,
          hasAnswered: false,
          promptAvailable: true,
        },
        snapshotNow: 99,
        state: 'OPEN',
        promptUrl: 'https://example.test/questions/question-1',
      }),
    );

    expect(html).toContain('View question');
    expect(html).not.toContain('question-card-link');
    expect(html).not.toContain('data-submission-status');
    expect(html).not.toContain('Not answered');
  });

  it('keeps the entire Results card linked to its question', () => {
    const html = renderToString(
      QuestionCard({
        item: {
          question: openQuestion,
          answerCount: 1,
          hasAnswered: true,
          promptAvailable: false,
        },
        snapshotNow: 100,
        state: 'REVEALED',
      }),
    );

    expect(html).toContain('View results');
    expect(html).toContain('question-card-link');
    expect(html).toContain('data-submission-status="answered"');
    expect(html).toContain('Answered');
  });

  it('places the answered check icon to the left of its message', () => {
    const html = renderToString(
      QuestionCard({
        item: {
          question: openQuestion,
          answerCount: 1,
          hasAnswered: true,
          promptAvailable: true,
        },
        snapshotNow: 99,
        state: 'OPEN',
        promptUrl: 'https://example.test/questions/question-1',
      }),
    );

    expect(html).toContain('data-agent-answered-message');
    expect(html).toContain('inline-flex w-fit items-center gap-1.5');
  });

  it('omits personal submission status when the viewer is anonymous', () => {
    const html = renderToString(
      QuestionCard({
        item: {
          question: openQuestion,
          answerCount: 0,
          hasAnswered: null,
          promptAvailable: false,
        },
        snapshotNow: 99,
        state: 'OPEN',
      }),
    );

    expect(html).not.toContain('data-submission-status');
  });
});
