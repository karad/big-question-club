import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 test environment', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS, { through: 1 });
  });

  it('reads and writes through the isolated D1 binding', async () => {
    const user = userFixture();
    await insertUser(env.TEST_DB, user);

    expect(
      await env.TEST_DB.prepare('SELECT id FROM user WHERE id = ?').bind(user.id).first(),
    ).toEqual({ id: user.id });
  });
});
