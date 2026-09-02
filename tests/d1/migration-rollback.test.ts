import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';

describe('migration rollback', () => {
  it('leaves neither partial schema nor ledger record after failure', async () => {
    await expect(
      applyMigrations(env.TEST_DB, [
        {
          name: 'failing_migration.sql',
          queries: [
            'CREATE TABLE should_rollback (id TEXT PRIMARY KEY)',
            'INSERT INTO table_that_does_not_exist (id) VALUES (1)',
          ],
        },
      ]),
    ).rejects.toThrow();

    expect(
      await env.TEST_DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'should_rollback'",
      ).first(),
    ).toBeNull();
    expect(
      await env.TEST_DB.prepare(
        "SELECT name FROM d1_migrations WHERE name = 'failing_migration.sql'",
      ).first(),
    ).toBeNull();
  });
});
