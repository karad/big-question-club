import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/** Better Auth user table. */
export const users = sqliteTable('user', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified').notNull(),
  image: text('image'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
});

/** Better Auth session table. */
export const sessions = sqliteTable('session', {
  id: text('id').primaryKey().notNull(),
  expiresAt: integer('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

/** Better Auth external-account table. */
export const accounts = sqliteTable(
  'account',
  {
    id: text('id').primaryKey().notNull(),
    issuer: text('issuer').notNull().default(''),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: integer('accessTokenExpiresAt'),
    refreshTokenExpiresAt: integer('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
  },
  (table) => [
    unique('account_provider_account_unique').on(table.providerId, table.accountId),
    uniqueIndex('account_issuer_account_id_unique').on(table.issuer, table.accountId),
  ],
);

/** Better Auth verification-token table. */
export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey().notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt').notNull(),
  createdAt: integer('createdAt'),
  updatedAt: integer('updatedAt'),
});

/** Question records and their publication schedule. */
export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey().notNull(),
    creatorUserId: text('creator_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    language: text('language').notNull(),
    publishedAt: integer('published_at'),
    closesAt: integer('closes_at').notNull(),
    revealsAt: integer('reveals_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check('questions_body_nonempty', sql`length(trim(${table.body})) > 0`),
    check('questions_language_nonempty', sql`length(trim(${table.language})) > 0`),
    check(
      'questions_publication_before_close',
      sql`${table.publishedAt} IS NULL OR ${table.publishedAt} < ${table.closesAt}`,
    ),
    check('questions_close_before_reveal', sql`${table.closesAt} <= ${table.revealsAt}`),
    index('questions_creator_user_id_created_at').on(table.creatorUserId, table.createdAt),
  ],
);

/** Participant answers, with one answer allowed per user and question. */
export const answers = sqliteTable(
  'answers',
  {
    id: text('id').primaryKey().notNull(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    excerpt: text('excerpt').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check('answers_body_valid', sql`length(trim(${table.body})) > 0`),
    check(
      'answers_excerpt_valid',
      sql`length(trim(${table.excerpt})) > 0 AND instr(${table.excerpt}, char(10)) = 0 AND instr(${table.excerpt}, char(13)) = 0`,
    ),
    unique('answers_question_user_unique').on(table.questionId, table.userId),
    index('answers_question_id_created_at').on(table.questionId, table.createdAt),
  ],
);

/** Users denied access to authenticated application features. */
export const bannedUsers = sqliteTable(
  'banned_users',
  {
    userId: text('user_id')
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bannedByUserId: text('banned_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reason: text('reason').notNull(),
    bannedAt: integer('banned_at').notNull(),
  },
  (table) => [index('banned_users_banned_at').on(table.bannedAt)],
);

/** Immutable records of administrator actions. */
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey().notNull(),
    actorUserId: text('actor_user_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    outcome: text('outcome').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('audit_logs_created_at').on(table.createdAt)],
);
