import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import type { AdminRepository } from '../../src/repositories/admin-repository';
import { createInMemoryQuestionRepository } from '../helpers/question-repository';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function adminRepository({ admin = true }: { admin?: boolean } = {}): AdminRepository {
  const users = [
    {
      id: 'admin-user',
      name: 'Admin',
      email: 'admin@example.com',
      createdAt: 1,
      bannedAt: null,
    },
    {
      id: 'managed-user',
      name: 'Managed',
      email: 'managed@example.com',
      createdAt: 2,
      bannedAt: null,
    },
  ];
  const questions = [
    {
      id: 'question-1',
      creatorUserId: 'managed-user',
      body: '<script>question secret</script>',
      language: 'auto',
      publishedAt: 1,
      closesAt: 10,
      revealsAt: 10,
      createdAt: 1,
      updatedAt: 1,
    },
  ];
  const answers = [
    {
      id: 'answer-1',
      questionId: 'question-1',
      userId: 'managed-user',
      body: '<script>answer secret</script>',
      excerpt: 'Answer excerpt',
      createdAt: 2,
      updatedAt: 2,
    },
  ];
  const auditLogs = [
    {
      id: 'audit-1',
      actorUserId: 'managed-user',
      action: 'ANSWER_SUBMITTED' as const,
      targetType: 'ANSWER' as const,
      targetId: 'answer-1',
      outcome: 'SUCCESS' as const,
      createdAt: 2,
    },
  ];
  return {
    isAdmin: vi.fn().mockResolvedValue(admin),
    isUserBanned: vi.fn().mockResolvedValue(false),
    getSummary: vi.fn().mockResolvedValue({
      userCount: users.length,
      questionCount: questions.length,
      answerCount: answers.length,
      auditLogCount: auditLogs.length,
    }),
    listUsers: vi.fn().mockResolvedValue({ items: users, totalItems: users.length }),
    listQuestions: vi.fn().mockResolvedValue({ items: questions, totalItems: questions.length }),
    listAnswers: vi.fn().mockResolvedValue({ items: answers, totalItems: answers.length }),
    listAuditLogs: vi.fn().mockResolvedValue({ items: auditLogs, totalItems: auditLogs.length }),
    deleteQuestion: vi.fn().mockResolvedValue('deleted'),
    deleteAnswer: vi.fn().mockResolvedValue('deleted'),
    banUser: vi.fn().mockResolvedValue('banned'),
    unbanUser: vi.fn().mockResolvedValue('unbanned'),
  };
}

function formRequest(path: string, body = new URLSearchParams({ confirm: 'on' })): Request {
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

describe('admin operations', () => {
  it.each([
    ['unauthenticated', undefined, adminRepository()],
    ['non-admin', 'managed-user', adminRepository({ admin: false })],
    ['unconfigured', 'admin-user', undefined],
  ] as const)(
    'returns the ordinary not-found response to %s without revealing administration',
    async (_label, userId, repository) => {
      for (const path of [
        '/club-operations',
        '/club-operations/users',
        '/club-operations/questions',
        '/club-operations/answers',
        '/club-operations/audit-log',
      ]) {
        const response = await createApp({
          authentication: authentication(userId),
          ...(repository === undefined ? {} : { adminRepository: repository }),
        }).request(`http://example.test${path}`);
        const html = await response.text();
        expect(response.status).toBe(404);
        expect(html).toBe('Not Found');
        expect(html).not.toContain('Administration');
        expect(html).not.toContain('administer');
        expect(html).not.toContain('href=');
        expect(html).not.toContain('question secret');
        expect(html).not.toContain('managed@example.com');
      }
    },
  );

  it('does not redirect or serve the former administration path', async () => {
    const repository = adminRepository();
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
    }).request('http://example.test/admin');
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not Found');
    expect(repository.getSummary).not.toHaveBeenCalled();
  });

  it('does not advertise administration from the public application', async () => {
    const response = await createApp({
      repository: createInMemoryQuestionRepository(),
      now: () => 5,
    }).request('http://example.test/');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).not.toContain('/club-operations');
    expect(html).not.toContain('Administration');
  });

  it('renders the four dedicated list destinations without embedding list records', async () => {
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: adminRepository(),
      now: () => 5,
    }).request('http://example.test/club-operations');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Cookie');
    expect(html).toContain('data-site-header');
    expect(html).toContain('big-question-club-logo.svg');
    expect(html).toContain('href="/styles.css"');
    expect(html).toContain('data-page="administration"');
    expect(html).toContain('aria-label="Content totals"');
    expect(html).toContain('Administration lists');
    expect(html).toContain('href="/club-operations/users"');
    expect(html).toContain('href="/club-operations/questions"');
    expect(html).toContain('href="/club-operations/answers"');
    expect(html).toContain('href="/club-operations/audit-log"');
    expect(html).toContain('Private operations');
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain('managed@example.com');
    expect(html).not.toContain('question secret');
    expect(html).not.toContain('answer secret');
    expect(html).not.toContain('/club-operations/users/admin-user/ban');
  });

  it.each([
    ['users', 'listUsers', 'managed@example.com'],
    ['questions', 'listQuestions', '&lt;script&gt;question secret&lt;/script&gt;'],
    ['answers', 'listAnswers', '&lt;script&gt;answer secret&lt;/script&gt;'],
    ['audit-log', 'listAuditLogs', 'ANSWER_SUBMITTED'],
  ] as const)('renders the %s list as a paged table', async (path, method, content) => {
    const repository = adminRepository();
    const firstPage = await repository[method](20, 0);
    vi.mocked(repository[method]).mockResolvedValue({
      items: firstPage.items,
      totalItems: 21,
    } as never);
    vi.mocked(repository[method]).mockClear();
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
      now: () => 5,
    }).request(`http://example.test/club-operations/${path}`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(repository[method]).toHaveBeenCalledWith(20, 0);
    expect(html).toContain('class="admin-table');
    expect(html).toContain(content);
    expect(html).toContain(`href="/club-operations/${path}?page=2"`);
    expect(html).toContain('Page 1 of 2');
    expect(html).not.toContain('<script>');
    if (path === 'users') {
      expect(html).toContain('>Ban</button>');
      expect(html).toContain('Confirm ban user');
    }
    if (path === 'questions' || path === 'answers') {
      expect(html).toContain('>Delete</button>');
      expect(html).toContain(`Confirm delete ${path === 'questions' ? 'question' : 'answer'}`);
    }
  });

  it('uses a twenty-item offset and a safe empty state for later pages', async () => {
    const repository = adminRepository();
    vi.mocked(repository.listQuestions).mockResolvedValue({ items: [], totalItems: 21 });
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
    }).request('http://example.test/club-operations/questions?page=2');
    const html = await response.text();

    expect(repository.listQuestions).toHaveBeenCalledWith(20, 20);
    expect(html).toContain('No questions on this page.');
    expect(html).toContain('Go to page 1');
    expect(html).toContain('Page 2 of 2');
  });

  it('renders administration errors with the shared visual assets and private indexing policy', async () => {
    const repository = adminRepository();
    vi.mocked(repository.getSummary).mockRejectedValue(new Error('unavailable'));
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
    }).request('http://example.test/club-operations');
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(html).toContain('href="/styles.css"');
    expect(html).toContain('class="paper-card mx-auto max-w-2xl border-red-900/20"');
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('Administration is unavailable. Try again.');
  });

  it.each([
    [
      'question deletion',
      '/club-operations/questions/question-1/delete',
      'deleteQuestion',
      'question-1',
    ],
    ['answer deletion', '/club-operations/answers/answer-1/delete', 'deleteAnswer', 'answer-1'],
    ['user ban', '/club-operations/users/managed-user/ban', 'banUser', 'managed-user'],
    ['user unban', '/club-operations/users/managed-user/unban', 'unbanUser', 'managed-user'],
  ] as const)('performs confirmed %s and redirects', async (_label, path, method, targetId) => {
    const repository = adminRepository();
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
      now: () => 123,
    }).request(formRequest(path));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      method === 'deleteQuestion'
        ? '/club-operations/questions'
        : method === 'deleteAnswer'
          ? '/club-operations/answers'
          : '/club-operations/users',
    );
    expect(repository[method]).toHaveBeenCalledWith(targetId, 'admin-user', 123);
  });

  it('requires explicit confirmation and administrator authorization for every mutation', async () => {
    const repository = adminRepository();
    const missingConfirmation = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
    }).request(formRequest('/club-operations/questions/question-1/delete', new URLSearchParams()));
    expect(missingConfirmation.status).toBe(400);
    expect(repository.deleteQuestion).not.toHaveBeenCalled();

    const forbiddenRepository = adminRepository({ admin: false });
    const forbidden = await createApp({
      authentication: authentication('managed-user'),
      adminRepository: forbiddenRepository,
    }).request(formRequest('/club-operations/questions/question-1/delete'));
    expect(forbidden.status).toBe(404);
    expect(await forbidden.text()).toBe('Not Found');
    expect(forbiddenRepository.deleteQuestion).not.toHaveBeenCalled();
  });

  it.each([
    ['missing deletion target', 'deleteQuestion', 'missing', 404],
    ['administrator self-ban', 'banUser', 'self-forbidden', 409],
    ['repository failure', 'deleteAnswer', 'unavailable', 503],
  ] as const)('maps %s to a safe status', async (_label, method, result, status) => {
    const repository = adminRepository();
    vi.mocked(repository[method]).mockResolvedValue(result as never);
    const path =
      method === 'banUser'
        ? '/club-operations/users/admin-user/ban'
        : `/club-operations/${method === 'deleteQuestion' ? 'questions/question-1' : 'answers/answer-1'}/delete`;
    const response = await createApp({
      authentication: authentication('admin-user'),
      adminRepository: repository,
    }).request(formRequest(path));
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('question secret');
  });
});
