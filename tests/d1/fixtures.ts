export type UserFixture = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

export function userFixture(id = 'user-1'): UserFixture {
  return {
    id,
    name: `User ${id}`,
    email: `${id}@example.test`,
    createdAt: 1_000,
  };
}

export function sessionFixture(userId = 'user-1') {
  return {
    id: `session-${userId}`,
    userId,
    token: `token-${userId}`,
    createdAt: 1_000,
    expiresAt: 10_000,
  };
}

export function questionFixture(creatorUserId = 'user-1') {
  return {
    id: 'question-1',
    creatorUserId,
    body: 'What makes an answer useful?',
    language: 'en',
    publishedAt: null,
    closesAt: 5_000,
    revealsAt: 6_000,
    createdAt: 1_000,
    updatedAt: 1_000,
  };
}

export function answerFixture(userId = 'user-1') {
  return {
    id: `answer-${userId}`,
    questionId: 'question-1',
    userId,
    body: `Answer from ${userId}`,
    excerpt: `Excerpt from ${userId}`,
    createdAt: 2_000,
  };
}

export async function insertUser(database: D1Database, user = userFixture()): Promise<void> {
  await database
    .prepare(
      'INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(user.id, user.name, user.email, 1, user.createdAt, user.createdAt)
    .run();
}

export async function insertSession(
  database: D1Database,
  session = sessionFixture(),
): Promise<void> {
  await database
    .prepare(
      'INSERT INTO session (id, expiresAt, token, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      session.id,
      session.expiresAt,
      session.token,
      session.createdAt,
      session.createdAt,
      session.userId,
    )
    .run();
}
