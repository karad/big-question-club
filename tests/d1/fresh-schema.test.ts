import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';

describe('fresh schema migrations', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it('applies the complete migration history exactly once', async () => {
    const migrations = await env.TEST_DB.prepare('SELECT name FROM d1_migrations ORDER BY id').all<{
      name: string;
    }>();
    const accountColumns = await env.TEST_DB.prepare('PRAGMA table_info(account)').all<{
      name: string;
    }>();

    expect(migrations.results.map(({ name }) => name)).toEqual([
      '0001_better_auth.sql',
      '0002_add_account_issuer.sql',
      '0003_add_questions_and_answers.sql',
      '0004_domain_data_lifecycle.sql',
      '0005_answer_revisions.sql',
      '0006_admin_operations.sql',
    ]);
    expect(accountColumns.results.filter(({ name }) => name === 'issuer')).toHaveLength(1);
  });
});
