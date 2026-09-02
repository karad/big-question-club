import { env } from 'cloudflare:test';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { answers, questions } from '../../src/db/schema';
import { applyMigrations } from './apply-migrations';

describe('Drizzle and D1 schema contract', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it.each([questions, answers])('matches columns for $', async (table) => {
    const tableName = getTableName(table);
    const expected = Object.values(getTableColumns(table)).map((column) => column.name);
    const actual = await env.TEST_DB.prepare(`PRAGMA table_info(${tableName})`).all<{
      name: string;
    }>();
    expect(actual.results.map(({ name }) => name)).toEqual(expected);
  });

  it('matches foreign keys, indexes, and CHECK constraints', async () => {
    const questionForeignKeys = await env.TEST_DB.prepare(
      'PRAGMA foreign_key_list(questions)',
    ).all<{ table: string; from: string; on_delete: string }>();
    const answerForeignKeys = await env.TEST_DB.prepare('PRAGMA foreign_key_list(answers)').all<{
      table: string;
      from: string;
      on_delete: string;
    }>();
    const indexes = await env.TEST_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name IN ('questions', 'answers') ORDER BY name",
    ).all<{ name: string }>();
    const definitions = await env.TEST_DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name IN ('questions', 'answers')",
    ).all<{ sql: string }>();

    expect(questionForeignKeys.results).toMatchObject([
      { table: 'user', from: 'creator_user_id', on_delete: 'RESTRICT' },
    ]);
    expect(answerForeignKeys.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: 'questions', from: 'question_id', on_delete: 'CASCADE' }),
        expect.objectContaining({ table: 'user', from: 'user_id', on_delete: 'RESTRICT' }),
      ]),
    );
    expect(indexes.results.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'answers_question_id_created_at',
        'questions_creator_user_id_created_at',
      ]),
    );
    expect(definitions.results.map(({ sql }) => sql).join('\n')).toContain('CHECK');
  });
});
