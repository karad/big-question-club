ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_account_id_unique"
  ON "account" ("issuer", "accountId");
