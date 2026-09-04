import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import type { Question } from '../../src/domain/question';
import { createAnswer, createInMemoryQuestionRepository } from '../helpers/question-repository';

const now = 1_000_000;
const hour = 60 * 60 * 1000;
const deadline = now + 2 * hour;
const creationToken = '00000000-0000-4000-8000-000000000001';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function draft(overrides: Partial<Question> = {}): Question {
  return {
    id: 'question-1',
    creatorUserId: 'creator-1',
    body: 'What should humanity improve?',
    language: 'auto',
    publishedAt: null,
    closesAt: deadline,
    revealsAt: deadline,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function appFor({
  userId = 'creator-1',
  questions = [],
  answers = [],
  timestamp = now,
}: {
  userId?: string | null;
  questions?: Question[];
  answers?: ReturnType<typeof createAnswer>[];
  timestamp?: number;
} = {}) {
  return createApp({
    authentication: authentication(userId ?? undefined),
    repository: createInMemoryQuestionRepository({ questions, answers }),
    now: () => timestamp,
  });
}

function validForm(overrides: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({
    body: 'What should humanity improve?',
    language: 'en',
    closesAtLocal: '2026-09-02T12:00',
    closesAt: String(deadline),
    timeZone: 'Asia/Tokyo',
    contentAcknowledged: 'on',
    creationToken,
    intent: 'draft',
    ...overrides,
  });
}

function formRequest(path: string, body: URLSearchParams): Request {
  return new Request(`http://example.test${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'http://example.test',
      'Sec-Fetch-Site': 'same-origin',
    },
    body,
  });
}

describe('Question management', () => {
  it('renders the English create form only for an authenticated human', async () => {
    const response = await appFor().request('http://example.test/questions/new');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('data-site-header');
    expect(html).toContain('big-question-club-logo.svg');
    expect(html).toContain('Create a question');
    expect(html).not.toContain('Primary language');
    expect(html).not.toContain('name="language"');
    expect(html).toContain('Answer deadline');
    expect(html).toContain('Save as draft');
    expect(html).toContain('data-question-form');
  });

  it('creates one draft and redirects to review', async () => {
    const app = appFor();
    const response = await app.request(formRequest('/questions', validForm()));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`/questions/${creationToken}/review`);
    const review = await app.request(`http://example.test/questions/${creationToken}/review`);
    expect(await review.text()).toContain('What should humanity improve?');
  });

  it('publishes immediately and treats an identical creation-token retry as the same question', async () => {
    const app = appFor();
    const publish = () => app.request(formRequest('/questions', validForm({ intent: 'publish' })));
    const first = await publish();
    const retry = await publish();
    expect(first.status).toBe(303);
    expect(first.headers.get('location')).toBe(`/questions/${creationToken}`);
    expect(retry.headers.get('location')).toBe(`/questions/${creationToken}`);
    expect((await app.request(`http://example.test/questions/${creationToken}`)).status).toBe(200);
  });

  it('rejects an invalid or conflicting creation token without exposing the existing question', async () => {
    expect(
      (await appFor().request(formRequest('/questions', validForm({ creationToken: 'invalid' }))))
        .status,
    ).toBe(400);
    const app = appFor();
    await app.request(formRequest('/questions', validForm()));
    const conflict = await app.request(
      formRequest(
        '/questions',
        validForm({ body: 'How should communities improve?', intent: 'publish' }),
      ),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.text()).not.toContain('What should humanity improve?');
  });

  it('allows only the owner to confirm deletion', async () => {
    const question = draft();
    const app = appFor({ questions: [question], answers: [createAnswer()] });
    const missingConfirmation = await app.request(
      formRequest('/questions/question-1/delete', new URLSearchParams({ expectedUpdatedAt: '1' })),
    );
    expect(missingConfirmation.status).toBe(400);
    const deleted = await app.request(
      formRequest(
        '/questions/question-1/delete',
        new URLSearchParams({ expectedUpdatedAt: '1', confirmDeletion: 'on' }),
      ),
    );
    expect(deleted.status).toBe(303);
    expect(deleted.headers.get('location')).toBe('/my/questions?deleted=1');
    expect((await app.request('http://example.test/questions/question-1')).status).toBe(404);
  });

  it('preserves valid values and escapes untrusted text after validation errors', async () => {
    const response = await appFor().request(
      formRequest(
        '/questions',
        validForm({ body: '<script>alert(1)</script>', closesAt: 'invalid' }),
      ),
    );
    const html = await response.text();
    expect(response.status).toBe(400);
    expect(html).toContain('Choose a valid answer deadline.');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it.each([
    ['short body', { body: 'short' }, 'Enter at least 10 characters.'],
    ['long body', { body: 'x'.repeat(1001) }, 'Enter no more than 1,000 characters.'],
    ['invalid deadline', { closesAt: 'invalid' }, 'Choose a valid answer deadline.'],
    ['too-soon deadline', { closesAt: String(now + hour - 1) }, 'between 1 hour and 30 days'],
    ['missing acknowledgment', { contentAcknowledged: '' }, 'suitable for public posting'],
  ])('shows a field error for %s', async (_label, overrides, message) => {
    const response = await appFor().request(formRequest('/questions', validForm(overrides)));
    expect(response.status).toBe(400);
    expect(await response.text()).toContain(message);
  });

  it('edits an owned draft with optimistic concurrency', async () => {
    const app = appFor({ questions: [draft()] });
    const page = await app.request('http://example.test/questions/question-1/edit');
    expect(await page.text()).toContain('What should humanity improve?');
    const form = validForm({
      body: 'How can humanity improve sleep?',
      expectedUpdatedAt: '1',
    });
    const response = await app.request(formRequest('/questions/question-1/edit', form));
    expect(response.status).toBe(303);
    const review = await app.request('http://example.test/questions/question-1/review');
    expect(await review.text()).toContain('How can humanity improve sleep?');
  });

  it('rejects a stale edit without overwriting the latest draft', async () => {
    const app = appFor({ questions: [draft({ updatedAt: 2 })] });
    const response = await app.request(
      formRequest('/questions/question-1/edit', validForm({ expectedUpdatedAt: '1' })),
    );
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('This draft changed.');
  });

  it('requires explicit confirmation before publishing', async () => {
    const response = await appFor({ questions: [draft()] }).request(
      formRequest('/questions/question-1/publish', new URLSearchParams({ expectedUpdatedAt: '1' })),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Confirm that you want to publish this question.');
  });

  it('publishes once and rejects later edit or publish attempts', async () => {
    const app = appFor({ questions: [draft()] });
    const publish = () =>
      app.request(
        formRequest(
          '/questions/question-1/publish',
          new URLSearchParams({ confirmPublication: 'on', expectedUpdatedAt: '1' }),
        ),
      );
    const first = await publish();
    expect(first.status).toBe(303);
    expect(first.headers.get('location')).toBe('/questions/question-1');
    expect((await publish()).status).toBe(409);
    expect((await app.request('http://example.test/questions/question-1/edit')).status).toBe(409);
  });

  it('revalidates the deadline at publication time', async () => {
    const question = draft({ closesAt: now + hour - 1, revealsAt: now + hour - 1 });
    const response = await appFor({ questions: [question] }).request(
      formRequest(
        '/questions/question-1/publish',
        new URLSearchParams({ confirmPublication: 'on', expectedUpdatedAt: '1' }),
      ),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('between 1 hour and 30 days');
  });

  it('lists only owned questions with state-specific actions and counts', async () => {
    const questions = [
      draft({ id: 'draft', createdAt: 4 }),
      draft({ id: 'open', publishedAt: now - hour, createdAt: 3 }),
      draft({
        id: 'closed',
        publishedAt: now - 3 * hour,
        closesAt: now - hour,
        revealsAt: now + hour,
        createdAt: 2,
      }),
      draft({
        id: 'revealed',
        publishedAt: now - 3 * hour,
        closesAt: now - hour,
        revealsAt: now - hour,
        createdAt: 1,
      }),
      draft({ id: 'other', creatorUserId: 'creator-2', body: 'Other private draft', createdAt: 5 }),
    ];
    const answers = [
      createAnswer({ questionId: 'open' }),
      createAnswer({ id: 'answer-2', questionId: 'open' }),
    ];
    const response = await appFor({ questions, answers }).request(
      'http://example.test/my/questions',
    );
    const html = await response.text();
    expect(html).toContain('DRAFT');
    expect(html).toContain('OPEN');
    expect(html).toContain('CLOSED');
    expect(html).toContain('Results available');
    expect(html).not.toContain('REVEALED');
    expect(html).toContain('Answers: 2');
    expect(html).toContain('Review and publish');
    expect(html).toContain('View question');
    expect(html).toContain('class="button-secondary mt-4"');
    expect(html).toContain('class="danger-disclosure');
    expect(html).toContain('data-delete-trigger="true"><span class="size-4 flex items-center"');
    const deleteConfirmation = html.match(
      /<div[^>]*data-delete-confirmation="true"[^>]*>[\s\S]*?<\/div>/,
    )?.[0];
    expect(deleteConfirmation).toContain('name="confirmDeletion"');
    expect(deleteConfirmation).toContain('Delete permanently');
    expect(deleteConfirmation).not.toContain('Status:');
    expect(deleteConfirmation).not.toContain('Answers:');
    expect(deleteConfirmation).not.toContain('This permanently deletes');
    expect(html).not.toContain('Other private draft');
    expect(html).not.toContain('A private answer body.');
    expect(html).not.toContain('A one-line excerpt.');
  });

  it('renders the My Questions empty state', async () => {
    const html = await (await appFor().request('http://example.test/my/questions')).text();
    expect(html).toContain('You haven&#39;t created any questions yet.');
    expect(html).toContain('Create a question');
    expect(html).not.toContain('href="/my/questions"');
  });

  it.each([
    { label: 'draft state', questions: [draft()], include: 'DRAFT' },
    { label: 'draft edit action', questions: [draft()], include: '>Edit<' },
    { label: 'draft review action', questions: [draft()], include: 'Review and publish' },
    { label: 'draft excludes view action', questions: [draft()], exclude: 'View question' },
    {
      label: 'open state',
      questions: [draft({ publishedAt: now - hour })],
      include: 'OPEN',
    },
    {
      label: 'open view action',
      questions: [draft({ publishedAt: now - hour })],
      include: 'View question',
    },
    {
      label: 'open excludes edit action',
      questions: [draft({ publishedAt: now - hour })],
      exclude: '>Edit<',
    },
    {
      label: 'closed state',
      questions: [
        draft({ publishedAt: now - 3 * hour, closesAt: now - hour, revealsAt: now + hour }),
      ],
      include: 'CLOSED',
    },
    {
      label: 'closed view action',
      questions: [
        draft({ publishedAt: now - 3 * hour, closesAt: now - hour, revealsAt: now + hour }),
      ],
      include: 'View question',
    },
    {
      label: 'revealed state',
      questions: [
        draft({ publishedAt: now - 3 * hour, closesAt: now - hour, revealsAt: now - hour }),
      ],
      include: 'Results available',
    },
    {
      label: 'revealed view action',
      questions: [
        draft({ publishedAt: now - 3 * hour, closesAt: now - hour, revealsAt: now - hour }),
      ],
      include: 'View question',
    },
    {
      label: 'answer count',
      questions: [draft()],
      answers: [createAnswer()],
      include: 'Answers: 1',
    },
    {
      label: 'other owner exclusion',
      questions: [draft({ creatorUserId: 'creator-2', body: 'Other owner question' })],
      exclude: 'Other owner question',
    },
    {
      label: 'answer body exclusion',
      questions: [draft()],
      answers: [createAnswer()],
      exclude: 'A private answer body.',
    },
    {
      label: 'answer excerpt exclusion',
      questions: [draft()],
      answers: [createAnswer()],
      exclude: 'A one-line excerpt.',
    },
  ])('renders My Questions case: $label', async ({ questions, answers = [], include, exclude }) => {
    const html = await (
      await appFor({ questions, answers }).request('http://example.test/my/questions')
    ).text();
    if (include !== undefined) expect(html).toContain(include);
    if (exclude !== undefined) expect(html).not.toContain(exclude);
  });

  it.each([
    ['create page', 'GET', '/questions/new'],
    ['create action', 'POST', '/questions'],
    ['list', 'GET', '/my/questions'],
    ['edit page', 'GET', '/questions/question-1/edit'],
    ['edit action', 'POST', '/questions/question-1/edit'],
    ['review', 'GET', '/questions/question-1/review'],
    ['publish', 'POST', '/questions/question-1/publish'],
  ])('rejects unauthenticated %s', async (_label, method, path) => {
    const app = appFor({ userId: null, questions: [draft()] });
    const response =
      method === 'GET'
        ? await app.request(`http://example.test${path}`)
        : await app.request(formRequest(path, validForm({ expectedUpdatedAt: '1' })));
    expect(response.status).toBe(401);
    expect(await response.text()).toContain('Sign in to manage questions.');
  });

  it.each([
    ['edit page', 'GET', '/questions/question-1/edit'],
    ['edit action', 'POST', '/questions/question-1/edit'],
    ['review', 'GET', '/questions/question-1/review'],
    ['publish', 'POST', '/questions/question-1/publish'],
  ])(
    'uses the same unavailable response for missing and other-owner %s',
    async (_label, method, path) => {
      const request = async (questions: Question[]) => {
        const app = appFor({ questions });
        return method === 'GET'
          ? app.request(`http://example.test${path}`)
          : app.request(formRequest(path, validForm({ expectedUpdatedAt: '1' })));
      };
      const missing = await request([]);
      const other = await request([draft({ creatorUserId: 'creator-2' })]);
      expect(missing.status).toBe(404);
      expect(other.status).toBe(404);
      expect(await missing.text()).toBe(await other.text());
    },
  );

  it.each(['/questions', '/questions/question-1/edit', '/questions/question-1/publish'])(
    'rejects a cross-site form submission to %s without changing data',
    async (path) => {
      const app = appFor({ questions: [draft()] });
      const response = await app.request(
        new Request(`http://example.test${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Origin: 'https://attacker.example',
            'Sec-Fetch-Site': 'cross-site',
          },
          body: validForm({ confirmPublication: 'on', expectedUpdatedAt: '1' }),
        }),
      );
      expect(response.status).toBe(403);
      const question = await app.request('http://example.test/questions/question-1/review');
      expect(question.status).toBe(200);
    },
  );

  it('does not expose question management as a WebMCP route', async () => {
    const app = appFor({ questions: [draft()] });
    for (const path of [
      '/api/questions/create',
      '/api/questions/question-1/edit',
      '/api/questions/question-1/publish',
    ]) {
      expect((await app.request(`http://example.test${path}`)).status).toBe(404);
    }
  });
});
