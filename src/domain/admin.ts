/** Base path for administration routes. */
export const ADMIN_PATH = '/club-operations';
/** Number of records displayed on one administration list page. */
export const ADMIN_PAGE_SIZE = 20;

export type AdminListKind = 'users' | 'questions' | 'answers' | 'audit-log';

export type AdminPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Builds the route for an administration list.
 * @param kind - Administration resource to display.
 * @returns The absolute application path for the list.
 */
export function adminListPath(kind: AdminListKind): string {
  return `${ADMIN_PATH}/${kind}`;
}

/**
 * Creates normalized pagination metadata for an administration list.
 * @param items - Records returned for the current page.
 * @param totalItems - Total number of matching records.
 * @param page - Requested one-based page number.
 * @returns The records and normalized pagination metadata.
 */
export function createAdminPage<T>(items: T[], totalItems: number, page: number): AdminPage<T> {
  return {
    items,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE)),
  };
}

/** Audit actions persisted by administration operations. */
export const AUDIT_ACTIONS = [
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
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditTargetType = 'SESSION' | 'QUESTION' | 'ANSWER' | 'USER';

/**
 * Reads and normalizes the configured administrator email address.
 * @param value - Raw environment-variable value.
 * @returns The normalized email address, or null when it is missing or invalid.
 */
export function readAdminEmail(value: string | undefined): string | null {
  if (value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  return normalized;
}
