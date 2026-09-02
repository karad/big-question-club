DROP TABLE "answers";
DROP TABLE "questions";

CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "creator_user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "body" TEXT NOT NULL CHECK(length(trim("body")) > 0),
  "language" TEXT NOT NULL CHECK(length(trim("language")) > 0),
  "published_at" INTEGER,
  "closes_at" INTEGER NOT NULL,
  "reveals_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  CHECK("published_at" IS NULL OR "published_at" < "closes_at"),
  CHECK("closes_at" <= "reveals_at")
);

CREATE TABLE "answers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "question_id" TEXT NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "body" TEXT NOT NULL CHECK(length(trim("body")) > 0 AND length("body") <= 5000),
  "excerpt" TEXT NOT NULL CHECK(
    length(trim("excerpt")) > 0
    AND length("excerpt") <= 160
    AND instr("excerpt", char(10)) = 0
    AND instr("excerpt", char(13)) = 0
  ),
  "created_at" INTEGER NOT NULL,
  UNIQUE("question_id", "user_id")
);

CREATE INDEX "questions_creator_user_id_created_at"
  ON "questions" ("creator_user_id", "created_at");
CREATE INDEX "answers_question_id_created_at"
  ON "answers" ("question_id", "created_at");
