import { describe, expect, it } from 'vitest';
import {
  ADMIN_PAGE_SIZE,
  AUDIT_ACTIONS,
  adminListPath,
  createAdminPage,
  readAdminEmail,
} from '../../src/domain/admin';

describe('admin configuration', () => {
  it('normalizes one configured admin email', () => {
    expect(readAdminEmail('  Admin@Example.COM ')).toBe('admin@example.com');
  });

  it.each([undefined, '', 'not-an-email', 'two@example.com,other@example.com'])(
    'rejects an absent or invalid admin email: %s',
    (value) => {
      expect(readAdminEmail(value)).toBeNull();
    },
  );

  it('keeps the complete audit action contract stable', () => {
    expect(AUDIT_ACTIONS).toEqual([
      'LOGIN',
      'LOGOUT',
      'QUESTION_CREATED',
      'QUESTION_UPDATED',
      'QUESTION_PUBLISHED',
      'QUESTION_DELETED',
      'ANSWER_SUBMITTED',
      'ANSWER_UPDATED',
      'ANSWER_REMOVED',
      'ADMIN_QUESTION_DELETED',
      'ADMIN_ANSWER_DELETED',
      'USER_BANNED',
      'USER_UNBANNED',
    ]);
  });

  it('keeps administration list paths stable', () => {
    expect(adminListPath('users')).toBe('/club-operations/users');
    expect(adminListPath('questions')).toBe('/club-operations/questions');
    expect(adminListPath('answers')).toBe('/club-operations/answers');
    expect(adminListPath('audit-log')).toBe('/club-operations/audit-log');
  });

  it.each([
    [0, 1],
    [20, 1],
    [21, 2],
    [40, 2],
    [41, 3],
  ])('creates twenty-item pages for %i total items', (totalItems, totalPages) => {
    expect(createAdminPage(['item'], totalItems, 2)).toEqual({
      items: ['item'],
      page: 2,
      pageSize: ADMIN_PAGE_SIZE,
      totalItems,
      totalPages,
    });
    expect(ADMIN_PAGE_SIZE).toBe(20);
  });
});
