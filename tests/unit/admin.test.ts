import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, readAdminEmail } from '../../src/domain/admin';

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
      'ANSWER_SUBMITTED',
      'ANSWER_UPDATED',
      'ANSWER_REMOVED',
      'ADMIN_QUESTION_DELETED',
      'ADMIN_ANSWER_DELETED',
      'USER_BANNED',
      'USER_UNBANNED',
    ]);
  });
});
