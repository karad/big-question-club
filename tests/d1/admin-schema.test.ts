import { env } from 'cloudflare:test';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { auditLogs, bannedUsers } from '../../src/db/schema';
import { applyMigrations } from './apply-migrations';

describe('admin operation schema', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it.each([bannedUsers, auditLogs])('matches the Drizzle columns for $', async (table) => {
    const tableName = getTableName(table);
    const expected = Object.values(getTableColumns(table)).map((column) => column.name);
    const actual = await env.TEST_DB.prepare(`PRAGMA table_info(${tableName})`).all<{
      name: string;
    }>();
    expect(actual.results.map(({ name }) => name)).toEqual(expected);
  });

  it('provides indexes and immutable audit references', async () => {
    const indexes = await env.TEST_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name IN ('banned_users', 'audit_logs') ORDER BY name",
    ).all<{ name: string }>();
    const auditForeignKeys = await env.TEST_DB.prepare('PRAGMA foreign_key_list(audit_logs)').all();

    expect(indexes.results.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['audit_logs_created_at', 'banned_users_banned_at']),
    );
    expect(auditForeignKeys.results).toEqual([]);
  });
});
