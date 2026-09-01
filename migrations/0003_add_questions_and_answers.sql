CREATE TABLE IF NOT EXISTS "questions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "body" TEXT NOT NULL,
  "closes_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "answers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "question_id" TEXT NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  UNIQUE("question_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "answers_question_id_created_at" ON "answers" ("question_id", "created_at");
