CREATE TABLE "banned_users" (
  "user_id" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "banned_by_user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "reason" TEXT NOT NULL,
  "banned_at" INTEGER NOT NULL
);

CREATE INDEX "banned_users_banned_at" ON "banned_users" ("banned_at");

CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL
);

CREATE INDEX "audit_logs_created_at" ON "audit_logs" ("created_at");

CREATE TRIGGER "audit_session_login"
AFTER INSERT ON "session"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."userId", 'LOGIN', 'SESSION', NEW."id", 'SUCCESS', NEW."createdAt");
END;

CREATE TRIGGER "audit_session_logout"
AFTER DELETE ON "session"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), OLD."userId", 'LOGOUT', 'SESSION', OLD."id", 'SUCCESS', unixepoch('subsec') * 1000);
END;

CREATE TRIGGER "audit_question_created"
AFTER INSERT ON "questions"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."creator_user_id", 'QUESTION_CREATED', 'QUESTION', NEW."id", 'SUCCESS', NEW."created_at");
END;

CREATE TRIGGER "audit_question_updated"
AFTER UPDATE ON "questions"
WHEN OLD."published_at" IS NEW."published_at"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."creator_user_id", 'QUESTION_UPDATED', 'QUESTION', NEW."id", 'SUCCESS', NEW."updated_at");
END;

CREATE TRIGGER "audit_question_published"
AFTER UPDATE ON "questions"
WHEN OLD."published_at" IS NULL AND NEW."published_at" IS NOT NULL
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."creator_user_id", 'QUESTION_PUBLISHED', 'QUESTION', NEW."id", 'SUCCESS', NEW."updated_at");
END;

CREATE TRIGGER "audit_answer_submitted"
AFTER INSERT ON "answers"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."user_id", 'ANSWER_SUBMITTED', 'ANSWER', NEW."id", 'SUCCESS', NEW."created_at");
END;

CREATE TRIGGER "audit_answer_updated"
AFTER UPDATE ON "answers"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."user_id", 'ANSWER_UPDATED', 'ANSWER', NEW."id", 'SUCCESS', NEW."updated_at");
END;

CREATE TRIGGER "audit_user_banned"
AFTER INSERT ON "banned_users"
BEGIN
  INSERT INTO "audit_logs" ("id", "actor_user_id", "action", "target_type", "target_id", "outcome", "created_at")
  VALUES (lower(hex(randomblob(16))), NEW."banned_by_user_id", 'USER_BANNED', 'USER', NEW."user_id", 'SUCCESS', NEW."banned_at");
END;
