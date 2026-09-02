# 実装タスク: Agent回答投稿の完全性・Sealed Answersの検証

**入力**: `specs/004-sealed-answer-verification/` の設計成果物  
**前提**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`  
**テスト方針**: 投稿・公開の純粋ロジック、D1一意制約、HTTP／SSR／WebMCPの経路を自動テストで保証する。

## 形式

- **[P]**: 異なるファイルで依存のない並行可能タスク
- **[US#]**: 対応するユーザーストーリー

## Phase 1: セットアップ

**目的**: 既存の認証・D1基盤へ、SPEC 004の実装と検証の入口を追加する。

- [X] T001 `wrangler.jsonc` と `src/types/env.d.ts` にQuestion・Answer用のD1バインディングを追加し、既存認証バインディングとの利用方針を統一する
- [X] T002 [P] `package.json` と `README.md` にローカルD1マイグレーションの実行手順を追加する
- [X] T003 [P] `tests/helpers/d1.ts` を追加し、Unit／Integration Test用にD1結果と失敗を再現する最小Fakeを提供する

---

## Phase 2: 基盤

**目的**: すべてのストーリーが共有する永続化、認証、時刻、公開判定を用意する。

**⚠️ 重要**: このPhaseの完了までユーザーストーリーの実装を開始しない。

- [X] T004 `migrations/0003_add_questions_and_answers.sql` にExcerpt列を含む`questions`、`answers`、外部キー、`UNIQUE(question_id, user_id)`、必要な検索indexを追加する
- [X] T005 [P] `src/domain/question.ts` にQuestion・時刻・ISO文字列変換の型と検証用定数を実装する
- [X] T006 [P] `src/domain/answer-submission.ts` に本文とExcerptの入力検証（Excerpt必須・改行なし・160文字以内）、投稿結果、重複・締切・認証エラー契約を実装する
- [X] T007 [P] `src/domain/answer-visibility.ts` に締切前後と主体・経路から、SSR一覧のExcerpt、クリック時の単一Body取得を決める純粋な公開判定を実装する
- [X] T008 `src/repositories/question-repository.ts` にprepared statementだけを使うQuestion取得、Answer挿入、本人Answer取得、Excerpt一覧取得、公開後の単一Answer Body取得を実装する
- [X] T009 `src/auth/session.ts` と `src/types/env.d.ts` を更新し、認証済み利用者とD1リポジトリをRouteへ安全に渡す依存性境界を整える
- [X] T010 `src/app.tsx` と `src/index.tsx` を更新し、D1と現在時刻を注入できるアプリケーション構成にする
- [X] T011 `tests/unit/answer-visibility.test.ts` と `tests/unit/answer-submission.test.ts` に締切直前・ちょうど・直後、本文／Excerptの空白・改行・上限超過、認証・重複エラーの境界テストを追加する

**チェックポイント**: D1の一意制約、投稿可否、公開可否をテスト可能な共通基盤として利用できる。

---

## Phase 3: ユーザーストーリー 1 - AgentがQuestionへ一度だけ回答を投稿する (優先度: P1) 🎯 MVP

**目標**: 認証済みPersonal Agentが締切前のQuestionへ1件だけAnswerを投稿し、再試行・同時投稿を安全に拒否できるようにする。

**独立テスト**: 同一利用者の連続10投稿と同時投稿を実行し、確定Answerが常に1件であることを確認する。

- [X] T012 [P] [US1] `tests/unit/answer-submission.test.ts` に`submit_answer`の入力・成功・未認証・Questionなし・締切・重複の契約テストを追加する
- [X] T013 [P] [US1] `tests/integration/answer-submission-api.test.ts` に認証済み投稿、再投稿、10組の同時投稿、既存Answer非上書きの統合テストを追加する
- [X] T014 [US1] `src/repositories/question-repository.ts` に一意制約違反を既存Answer非変更の`ANSWER_ALREADY_SUBMITTED`へ変換する投稿処理を完成させる
- [X] T015 [US1] `src/routes/submit-answer.ts` に`POST /api/questions/:questionId/answers`の認証、入力、Worker側時刻、HTTPエラー変換を実装する
- [X] T016 [US1] `src/app.tsx` にAnswer投稿Routeを登録し、すべての投稿応答へ`Cache-Control: no-store`を設定する
- [X] T017 [US1] `src/webmcp/register-submit-answer-tool.ts` に厳格な`questionId`・`answer`・`excerpt`入力schemaと書込みTool登録を実装する
- [X] T018 [US1] `src/client.ts` に`submit_answer`のWebMCP Tool登録を追加する
- [X] T019 [P] [US1] `tests/unit/register-submit-answer-tool.test.ts` にExcerptを含む入力schema、成功、409エラー、取消、ネットワーク障害のToolテストを追加する
- [X] T020 [US1] `tests/integration/answer-submission-api.test.ts` に締切直前・ちょうど・締切後の投稿受理／拒否テストを追加する
- [X] T021 [US1] `specs/004-sealed-answer-verification/quickstart.md` の投稿完全性手順に実装したエラーコードと実行結果記入欄を反映する

**チェックポイント**: 同一利用者・同一Questionの確定Answerは1件だけで、締切時刻と同時以降の投稿は拒否される。

---

## Phase 4: ユーザーストーリー 2 - 回答受付中は他者のAnswerを見られない (優先度: P1)

**目標**: 締切前の3経路で本人以外のAnswer本文、Excerpt、抜粋、要約、存在の手掛かりを公開しない。

**独立テスト**: 2利用者が投稿後、締切前にSSR、直接HTTP API、WebMCPの各経路から相手のAnswer取得を試みても漏えいがないことを確認する。

- [X] T022 [P] [US2] `tests/unit/answer-visibility.test.ts` に締切前の本人・他者・未認証者とSSR／HTTP／WebMCP別の公開判定テストを追加する
- [X] T023 [P] [US2] `tests/integration/question-visibility.test.ts` に締切前の2利用者・未認証者からのSSR、HTTP API、Answer詳細APIの非露出テストを追加する
- [X] T024 [US2] `src/routes/question.ts` に`GET /api/questions/:questionId`と`GET /api/questions/:questionId/my-submission`を実装し、本人状態以外のAnswer情報を返さない
- [X] T025 [US2] `src/app.tsx` にQuestion APIと本人投稿状況Routeを登録し、未認証・不存在時のエラーを契約どおりに返す
- [X] T026 [US2] `src/webmcp/register-my-submission-tool.ts` に読み取り専用の`get_my_submission` Toolを実装する
- [X] T027 [US2] `src/client.ts` に`get_my_submission`のWebMCP Tool登録を追加する
- [X] T028 [P] [US2] `tests/unit/register-my-submission-tool.test.ts` に本人状態だけを解析し、他者Answerを受理しないToolテストを追加する
- [X] T029 [US2] `tests/integration/question-visibility.test.ts` に直接Answer取得、Answer一覧、Excerpt・抜粋・要約相当の未定義経路が他者情報を返さないテストを追加する

**チェックポイント**: 締切前は全経路で他者Answerの本文、抜粋、要約、識別子が露出しない。

---

## Phase 5: ユーザーストーリー 3 - 締切後にHumanが回答を比較する (優先度: P2)

**目標**: 締切後に認証済みHumanがSSRでExcerpt一覧を読み、クリック時の詳細APIで1件のBodyを展開する。WebMCPは他者Answerを返さない。

**独立テスト**: 固定時刻を締切前後に切り替え、SSRだけが締切後に全Answerを表示することを確認する。

- [X] T030 [P] [US3] `tests/unit/answer-visibility.test.ts` に締切後のSSR公開、HTTP／WebMCP非公開、0件空状態の判定テストを追加する
- [X] T031 [P] [US3] `tests/integration/question-visibility.test.ts` に締切後の認証済みSSR Excerpt一覧、クリック時の単一Body表示、Answer詳細APIの認可統合テストを追加する
- [X] T032 [US3] `src/routes/question.ts` に`GET /questions/:questionId`の認証済みHuman向けSSRと`GET /api/questions/:questionId/answers/:answerId`を実装し、締切前は`Answers are sealed`、締切後はExcerpt一覧、クリック時は該当Bodyだけを表示する
- [X] T033 [US3] `src/app.tsx` にQuestion詳細SSR Routeを登録し、既存の認証状態表示をQuestion詳細へ接続する
- [X] T034 [US3] `tests/integration/question-visibility.test.ts` に締切後もWebMCPが他者Answerを返さず、Answer詳細APIが要求された1件だけを返す回帰テストを追加する
- [X] T035 [US3] `specs/004-sealed-answer-verification/contracts/question-visibility.md` を実装済みSSR表示、空状態、経路別応答と照合して更新する
- [X] T036 [US3] `specs/004-sealed-answer-verification/quickstart.md` の締切後SSR／HTTP／WebMCPの手動検証マトリクスに結果記入欄を追加する

**チェックポイント**: 締切後は認証済みHumanのSSRがExcerpt一覧を表示し、認証済みHumanだけが詳細APIで要求した1件のBodyを取得できる。Agentは他者Answerを取得できない。

---

## Phase 6: 仕上げと横断的確認

**目的**: 全ストーリーの品質、文書、再現手順を完成させる。

- [X] T037 [P] `tests/integration/answer-submission-api.test.ts` と `tests/integration/question-visibility.test.ts` の2利用者・締切前後・3経路マトリクスを成功基準SC-001からSC-005へ対応付ける
- [X] T038 [P] `README.md` と `specs/004-sealed-answer-verification/quickstart.md` にローカルD1、2利用者、WebMCPの安全な手動検証手順を同期する
- [X] T039 `specs/004-sealed-answer-verification/validation-record.md` を追加し、秘密情報を含めないGo/No-Go、受け入れ条件、テスト結果、未解決事項の記録テンプレートを作成する
- [X] T040 `MILESTONE.md`、`USE_CODEX.md`、`specs/004-sealed-answer-verification/{spec.md,plan.md,data-model.md,contracts/,quickstart.md}` を実装・検証結果と照合し、`npm test`、`npm run typecheck`、`npm run lint`、`npm run format`を実行して記録する

---

## 依存関係と実行順

- Phase 1 → Phase 2が全ストーリーの前提である。
- US1とUS2はPhase 2後に開始できるが、US2の手動検証にはUS1の投稿機能が必要である。
- US3はUS2の公開境界を維持した上でSSR表示を追加するため、US2完了後に実施する。
- 仕上げはUS1〜US3の完了後に実施する。

```text
Setup → Foundation → US1 → US2 → US3 → Polish
```

## 並行実行の例

### 基盤

```text
T005: src/domain/question.ts
T006: src/domain/answer-submission.ts
T007: src/domain/answer-visibility.ts
```

### US1

```text
T012: tests/unit/answer-submission.test.ts
T013: tests/integration/answer-submission-api.test.ts
T019: tests/unit/register-submit-answer-tool.test.ts
```

### US2

```text
T022: tests/unit/answer-visibility.test.ts
T023: tests/integration/question-visibility.test.ts
T028: tests/unit/register-my-submission-tool.test.ts
```

## 実装戦略

1. Phase 1と2でD1制約・共通判定を確立する。
2. US1を実装し、1利用者1Answerと締切境界を自動テストで検証する。
3. US2で締切前の非露出を3経路に拡張して検証する。
4. US3でSSR Revealを追加し、API／WebMCPの非露出を回帰確認する。
5. すべての自動テストと手動マトリクスを満たしたときだけSPEC 004を完了とする。
