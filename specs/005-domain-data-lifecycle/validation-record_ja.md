# 検証記録: ドメインデータモデルとQuestionライフサイクル

## User Story 1: 状態判定

- 実行日: 2026-09-02
- 状態判定: DRAFT優先、OPEN、締切境界、CLOSED、Reveal境界、同時締切・Revealを含む21ケースを各10回評価し、全件一致・重複状態0件
- Unit／Integration回帰: `npm test -- tests/unit/question-lifecycle.test.ts tests/unit/question-schedule.test.ts tests/integration/question-visibility.test.ts tests/integration/answer-submission-api.test.ts`
- 結果: 4ファイル、46テスト成功
- 型検査: `npm run typecheck` 成功
- 確認事項: 締切後かつReveal前はAnswer一覧・Answer本文を公開しない

## User Story 2: 適用前確認

- 実行日: 2026-09-02
- Local: `wrangler d1 migrations list --local` で空DBを確認し、`0001`〜`0003`が未適用
- Remote: `d1_migrations` を読み取り、`0001`〜`0003`が適用済み、`0002_add_account_issuer.sql` は 2026-09-01 13:10:52 に適用済み
- Remote検証データ: Questionは `spec-004-e2e-20260902` の1件、Answerは2件。SPEC 004の検証識別子および既存検証記録と一致し、一般利用データは存在しない
- Remoteへの書き込み・Migration適用: 未実施

## User Story 2: SchemaとRepository

- 先行失敗: Fresh／Schema／Repositoryの3ファイルは、修正前に `duplicate column name: issuer` で失敗することを確認
- 実D1: Fresh全Migration、必須値・CHECK・外部キー・UNIQUE・削除規則、Draft作成・公開・再取得、2 UserのAnswer、重複・孤立参照を検証
- 結果: 3ファイル、8テスト成功

## User Story 3: 書き込みガード

- Unit／既存Integration: 4ファイル、27テスト成功
- 実D1: 条件付き公開、DRAFT／締切境界／CLOSED／REVEALED拒否、逐次10回、同時10件、制約エラー分類を検証
- 結果: 1ファイル、7テスト成功。逐次・同時とも各Userにつき成功1件、重複9件

## User Story 4: Migration経路

- SPEC 004相当DB: User／Sessionを保持し、検証Question／Answerを本番Schemaへ置換
- 失敗Migration: 部分テーブルと台帳記録の双方がrollbackされることを確認
- Schema契約: PRAGMAの列・外部キー・Index・CHECKをDrizzle Schemaの期待値と照合
- 結果: 3ファイル、5テスト成功
- 10回反復: Fresh／legacy／rollback／Schema契約の4ファイル・6テストを各10回実行し、10/10回・計60テスト成功
- 所要時間: 各回4.38〜4.50秒、全体約48秒（30分以内）

## 最終品質ゲート

- `npm test`: 19ファイル、118テスト成功
- `npm run test:d1`: 8ファイル、21テスト成功
- `npm run typecheck`: 成功
- `npm run lint`: 成功
- `npm run format`: 成功
- `npm run build`: 成功
- `npm run db:schema:check`: 成功
- `git diff --check`: 成功
- 実行環境注記: ホストはNode.js v23.6.0で、package.jsonが保証するNode.js 22.13系または24以上の範囲外。全ゲートは成功したが、継続開発では保証範囲のNode.jsを使用する
- Remote D1 Migration: 設計どおり未適用
