import { desc, eq } from 'drizzle-orm';
import { createDatabase } from '../db/client';
import { answers, auditLogs, bannedUsers, questions, users } from '../db/schema';
import type { AuditAction, AuditTargetType } from '../domain/admin';
import type { Answer, Question } from '../domain/question';

export type AdminUserView = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  bannedAt: number | null;
};

export type AuditLogView = {
  id: string;
  actorUserId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  outcome: 'SUCCESS';
  createdAt: number;
};

export type AdminDashboard = {
  users: AdminUserView[];
  questions: Question[];
  answers: Answer[];
  auditLogs: AuditLogView[];
};

export type DeleteAdminTargetResult = 'deleted' | 'missing' | 'unavailable';
export type BanUserResult =
  'banned' | 'already-banned' | 'missing' | 'self-forbidden' | 'unavailable';
export type UnbanUserResult = 'unbanned' | 'not-banned' | 'missing' | 'unavailable';

export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>;
  isUserBanned(userId: string): Promise<boolean>;
  getDashboard(): Promise<AdminDashboard>;
  deleteQuestion(
    questionId: string,
    actorUserId: string,
    now: number,
  ): Promise<DeleteAdminTargetResult>;
  deleteAnswer(
    answerId: string,
    actorUserId: string,
    now: number,
  ): Promise<DeleteAdminTargetResult>;
  banUser(userId: string, actorUserId: string, now: number): Promise<BanUserResult>;
  unbanUser(userId: string, actorUserId: string, now: number): Promise<UnbanUserResult>;
}

export function createAdminRepository(
  database: D1Database,
  adminEmail: string | null,
): AdminRepository {
  const db = createDatabase(database);
  return {
    async isAdmin(userId) {
      if (adminEmail === null) return false;
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user?.email.trim().toLowerCase() === adminEmail;
    },
    async isUserBanned(userId) {
      const [ban] = await db
        .select({ userId: bannedUsers.userId })
        .from(bannedUsers)
        .where(eq(bannedUsers.userId, userId))
        .limit(1);
      return ban !== undefined;
    },
    async getDashboard() {
      const [userRows, questionRows, answerRows, auditRows] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
            bannedAt: bannedUsers.bannedAt,
          })
          .from(users)
          .leftJoin(bannedUsers, eq(bannedUsers.userId, users.id))
          .orderBy(desc(users.createdAt), desc(users.id)),
        db.select().from(questions).orderBy(desc(questions.createdAt), desc(questions.id)),
        db.select().from(answers).orderBy(desc(answers.createdAt), desc(answers.id)),
        db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)),
      ]);
      return {
        users: userRows,
        questions: questionRows,
        answers: answerRows,
        auditLogs: auditRows as AuditLogView[],
      };
    },
    async deleteQuestion(questionId, actorUserId, now) {
      return deleteTarget(database, 'questions', questionId, actorUserId, now, {
        action: 'ADMIN_QUESTION_DELETED',
        targetType: 'QUESTION',
      });
    },
    async deleteAnswer(answerId, actorUserId, now) {
      return deleteTarget(database, 'answers', answerId, actorUserId, now, {
        action: 'ADMIN_ANSWER_DELETED',
        targetType: 'ANSWER',
      });
    },
    async banUser(userId, actorUserId, now) {
      if (userId === actorUserId) return 'self-forbidden';
      try {
        const [user, existing] = await Promise.all([
          database.prepare('SELECT id FROM user WHERE id = ?').bind(userId).first(),
          database
            .prepare('SELECT user_id FROM banned_users WHERE user_id = ?')
            .bind(userId)
            .first(),
        ]);
        if (user === null) return 'missing';
        if (existing !== null) return 'already-banned';
        await database.batch([
          database
            .prepare(
              'INSERT INTO banned_users (user_id, banned_by_user_id, reason, banned_at) VALUES (?, ?, ?, ?)',
            )
            .bind(userId, actorUserId, 'Policy violation', now),
          database.prepare('DELETE FROM session WHERE userId = ?').bind(userId),
        ]);
        return 'banned';
      } catch {
        return 'unavailable';
      }
    },
    async unbanUser(userId, actorUserId, now) {
      try {
        const [user, existing] = await Promise.all([
          database.prepare('SELECT id FROM user WHERE id = ?').bind(userId).first(),
          database
            .prepare('SELECT user_id FROM banned_users WHERE user_id = ?')
            .bind(userId)
            .first(),
        ]);
        if (user === null) return 'missing';
        if (existing === null) return 'not-banned';
        const results = await database.batch([
          auditExistingTargetStatement(
            database,
            'banned_users',
            'user_id',
            userId,
            actorUserId,
            'USER_UNBANNED',
            'USER',
            now,
          ),
          database.prepare('DELETE FROM banned_users WHERE user_id = ?').bind(userId),
        ]);
        return (results[1]?.meta.changes ?? 0) > 0 ? 'unbanned' : 'not-banned';
      } catch {
        return 'unavailable';
      }
    },
  };
}

async function deleteTarget(
  database: D1Database,
  table: 'questions' | 'answers',
  targetId: string,
  actorUserId: string,
  now: number,
  audit: { action: AuditAction; targetType: AuditTargetType },
): Promise<DeleteAdminTargetResult> {
  try {
    const target = await database
      .prepare(`SELECT id FROM ${table} WHERE id = ?`)
      .bind(targetId)
      .first();
    if (target === null) return 'missing';
    const results = await database.batch([
      auditExistingTargetStatement(
        database,
        table,
        'id',
        targetId,
        actorUserId,
        audit.action,
        audit.targetType,
        now,
      ),
      database.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(targetId),
    ]);
    return (results[1]?.meta.changes ?? 0) > 0 ? 'deleted' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

function auditExistingTargetStatement(
  database: D1Database,
  table: 'questions' | 'answers' | 'banned_users',
  idColumn: 'id' | 'user_id',
  targetId: string,
  actorUserId: string,
  action: AuditAction,
  targetType: AuditTargetType,
  now: number,
): D1PreparedStatement {
  return database
    .prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, outcome, created_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM ${table} WHERE ${idColumn} = ?)`,
    )
    .bind(crypto.randomUUID(), actorUserId, action, targetType, targetId, 'SUCCESS', now, targetId);
}
