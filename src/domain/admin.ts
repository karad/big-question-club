export const ADMIN_PATH = '/club-operations';

export const AUDIT_ACTIONS = [
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
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditTargetType = 'SESSION' | 'QUESTION' | 'ANSWER' | 'USER';

export function readAdminEmail(value: string | undefined): string | null {
  if (value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  return normalized;
}
