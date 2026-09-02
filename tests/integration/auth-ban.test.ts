import { describe, expect, it, vi } from 'vitest';
import { createSessionBanGuard, isUserBanned } from '../../src/auth/auth';

function databaseWithBanState(banned: boolean): D1Database {
  const first = vi.fn().mockResolvedValue(banned ? { user_id: 'user-1' } : null);
  const bind = vi.fn().mockReturnValue({ first });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare } as unknown as D1Database;
}

describe('authentication ban guard', () => {
  it('rejects session creation for a banned user', async () => {
    const before = createSessionBanGuard(databaseWithBanState(true));
    await expect(before({ userId: 'user-1' })).resolves.toBe(false);
  });

  it('allows session creation for an active user', async () => {
    const before = createSessionBanGuard(databaseWithBanState(false));
    await expect(before({ userId: 'user-1' })).resolves.toBeUndefined();
  });

  it('checks ban state by the authenticated user id', async () => {
    await expect(isUserBanned(databaseWithBanState(true), 'user-1')).resolves.toBe(true);
    await expect(isUserBanned(databaseWithBanState(false), 'user-1')).resolves.toBe(false);
  });
});
