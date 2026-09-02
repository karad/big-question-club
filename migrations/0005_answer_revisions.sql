PRAGMA foreign_keys = OFF;

CREATE TABLE answers_next (
  id TEXT PRIMARY KEY NOT NULL,
  question_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT answers_body_valid CHECK (length(trim(body)) > 0),
  CONSTRAINT answers_excerpt_valid CHECK (
    length(trim(excerpt)) > 0
    AND instr(excerpt, char(10)) = 0
    AND instr(excerpt, char(13)) = 0
  ),
  CONSTRAINT answers_question_user_unique UNIQUE(question_id, user_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE RESTRICT
);

INSERT INTO answers_next (id, question_id, user_id, body, excerpt, created_at, updated_at)
SELECT id, question_id, user_id, body, excerpt, created_at, created_at FROM answers;

DROP TABLE answers;
ALTER TABLE answers_next RENAME TO answers;
CREATE INDEX answers_question_id_created_at ON answers(question_id, created_at);

PRAGMA foreign_keys = ON;
