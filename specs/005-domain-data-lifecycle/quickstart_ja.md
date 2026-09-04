# Quickstart: ドメインデータモデルとQuestionライフサイクルの検証

## 目的

空DBとSPEC 004 Schemaの両方からMigrationでき、4状態、時刻境界、一意性、参照整合性、`OPEN`だけのAnswer受付を自動検証する。実装方針は [plan_ja.md](./plan_ja.md)、Entityと制約は [data-model_ja.md](./data-model_ja.md)、内部結果は [domain-persistence_ja.md](./contracts/domain-persistence_ja.md) を参照する。

## 前提

- Node.js 22.13以上または24以上
- npm 10系
- リポジトリルートで実行する
- 依存関係が `npm install` 済みである
- Remote D1は使わず、テストごとに分離されたローカルD1を使う

## 1. 純粋なライフサイクル検証

```bash
npm test -- tests/unit/question-lifecycle.test.ts
```

期待結果:

- `DRAFT`、`OPEN`、`CLOSED`、`REVEALED`と全境界を含む20件以上が成功する。
- `closesAt === revealsAt`の境界で `REVEALED`だけが返る。
- 不正な時刻順序、未来の公開、過去状態への巻き戻しが拒否される。
- 実時間待機や外部サービスを必要としない。

## 2. 空DBへの全Migration

```bash
npm run test:d1 -- tests/d1/fresh-schema.test.ts
```

期待結果:

- `0001`〜`0004`が空の分離D1へ順に適用される。
- User、Session、Account、Verification、Question、Answerの必須列、外部キー、CHECK、一意Indexが存在する。
- 存在しないUser／Questionを参照するデータと不正なQuestion時刻が拒否される。

## 3. SPEC 004 Schemaからの差分Migration

```bash
npm run test:d1 -- tests/d1/legacy-upgrade.test.ts
```

期待結果:

- `0001`〜`0003`適用後に用意したUser、Session、検証Question、検証Answerへ`0004`を適用できる。
- UserとSessionは同じIDと認証値で残る。
- 旧検証Question／Answerは本番用構造へ置換される。
- 部分適用や外部キー違反を成功として扱わない。

## 4. Repositoryと同時書き込み

```bash
npm run test:d1 -- tests/d1/question-repository.test.ts
```

期待結果:

- Draft作成、公開確定、4状態の取得が内部契約どおり動く。
- `OPEN`だけがAnswerを受け付ける。
- 同じUser・Questionへの逐次10回と同時10件の投稿でAnswerは1件だけ確定する。
- 重複、Question不存在、Question非公開・締切済み、参照先不存在、想定外障害を混同しない。

## 5. 全品質ゲート

```bash
npm test
npm run test:d1
npm run typecheck
npm run lint
npm run format
npm run build
```

期待結果: すべて終了コード0で完了し、既存の認証、SSR、HTTP API、WebMCPテストに回帰がない。

## 6. ローカルMigrationの手動確認

自動テスト完了後、必要な場合だけ既存のローカルD1へ適用する。

```bash
npm run db:migrate:local
```

期待結果:

- 未適用のMigrationだけが適用される。
- 同じコマンドを再実行しても0004は再適用されない。

## Remote適用前の停止条件

適用判断の前に、必ず読み取り確認と復旧用exportを行う。

```bash
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT id FROM questions ORDER BY id; SELECT COUNT(*) AS answer_count FROM answers;"
npx wrangler d1 export big-question-club-auth --remote --output ./big-question-club-auth-backup.sql
```

exportファイルには認証情報が含まれるため、Gitへ追加せず、安全な保管先と復旧担当者を確認する。

- Remoteの `questions` または `answers` にSPEC 004の検証用途ではないデータが1件でも存在する。
- Remote適用台帳で0001または0002の状態を確認できない。
- User／Session保持テスト、外部キー検査、全品質ゲートのいずれかが失敗する。
- Migration適用前のexportまたは復旧手段を確認できていない。

本QuickstartではRemote Migrationを実行しない。Remote適用はレビューとデータ確認後に別途行う。
