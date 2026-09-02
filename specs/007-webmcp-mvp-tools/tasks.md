# タスク: WebMCP MVP Tool群

**入力**: `specs/007-webmcp-mvp-tools/` の設計文書  
**前提**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**テスト方針**: 1行Prompt、環境追従URL、書記素境界、Tool SchemaはUnit Test、認証・HTTP・SSR・WebMCP導線はIntegration Test、D1 Migration・本人限定更新削除・競合はWorkers D1 Integration Testで失敗先行にする。最後に実ブラウザーとPersonal AgentでQuickstartを確認する。

**構成**: 6つのユーザーストーリーを独立検証可能なPhaseに分け、全40タスクを依存順に実行する。

## Phase 1: セットアップと現状固定

**目的**: 既存のSPEC 004〜006実装を壊さず、SPEC 007の検証記録と共通テスト補助を準備する。

- [X] T001 現在のブランチ、既存4 Tool登録、Node／D1テスト、型検査、Lint、Buildの基準結果を `specs/007-webmcp-mvp-tools/validation-record.md` に記録する
- [X] T002 [P] WebMCP Tool登録定義とfetch応答を検査する共通テスト補助を `tests/helpers/webmcp.ts` に追加する
- [X] T003 [P] SPEC 007のQuestion・Answer・2利用者・締切境界fixtureを `tests/helpers/question-repository.ts` に追加する

---

## Phase 2: 共通基盤

**目的**: 全ユーザーストーリーを支えるAnswer更新時刻、表示文字契約、共通エラー、Repository境界を確立する。

**⚠️ 重要**: このPhaseが完了するまでユーザーストーリー実装へ進まない。

- [X] T004 [P] `tests/d1/schema-contract.test.ts` と `tests/d1/legacy-upgrade.test.ts` に `answers.updated_at`、既存Answer保持、表示文字CHECK移管の失敗先行Migrationテストを追加する
- [X] T005 `migrations/0005_answer_revisions.sql` と `src/db/schema.ts` にAnswer表再構築、`updated_at`、空白・改行・一意性・参照制約を実装する
- [X] T006 [P] `tests/unit/answer-submission.test.ts` に本文1／5,000／5,001書記素、Excerpt 1／160／161書記素、結合文字、絵文字、改行、定義外項目の失敗先行テストを追加する
- [X] T007 `src/domain/question-input.ts` と `src/domain/answer-submission.ts` に共通書記素カウントと投稿・更新共通入力契約を実装する
- [X] T008 [P] `src/domain/answer-submission.ts` に `INVALID_INPUT`、`ANSWER_NOT_FOUND`、`TOOL_UNAVAILABLE` を含む英語共通エラー契約を追加し、既存コードとの移行を固定するUnit Testを `tests/unit/answer-submission.test.ts` に追加する
- [X] T009 `src/domain/question.ts`、`src/repositories/question-repository.ts`、`tests/helpers/question-repository.ts` に `Answer.updatedAt` とsubmit／update／remove結果型・Repositoryメソッドを追加する
- [X] T010 [P] 認証、Draft非列挙、非 `OPEN`、一時障害、`Cache-Control: no-store` の共通期待値を `tests/integration/webmcp-question-api.test.ts` と `tests/integration/answer-mutation-api.test.ts` に失敗先行で追加する

**チェックポイント**: Migration、Domain入力、共通エラー、Repository Interfaceが全Storyから利用可能になる。

---

## Phase 3: ユーザーストーリー1 — Question画面からAgentへの依頼文をコピーする (P1) 🎯

**目標**: 認証済み・未投稿・`OPEN` のQuestion画面だけに、現在のOriginへ追従するQuestion絶対URLを含む1行Promptを表示し、コピー成功・失敗を英語で通知する。

**独立テスト**: Question本文にInjectionを含めてもPromptにはQueryとFragmentを除いたQuestion絶対URLだけが可変値として入り、コピー結果が表示と一致し、失敗時も手動コピーでき、コピーだけではToolを実行しない。

- [X] T011 [P] [US1] 1行の確定英語Prompt、現在のOriginを含むQuestion絶対URL、Query／Fragment／Question本文の非混入、HTML escapingを検証する失敗先行Unit Testを `tests/unit/agent-request-prompt.test.ts` に追加する
- [X] T012 [US1] 環境追従するQuestion絶対URLと1行Promptの生成、および表示可否判定の純粋関数を `src/domain/agent-request-prompt.ts` に実装する
- [X] T013 [P] [US1] 認証済み未投稿Open／未認証／投稿済み／Draft／Closed／RevealedのSSR表示分岐を `tests/integration/agent-request-prompt.test.ts` に失敗先行で追加する
- [X] T014 [US1] `Ask your personal agent`、注意文、選択可能Prompt、`Copy prompt`、status領域を `src/views/question-detail.tsx` に実装し `src/routes/question.ts` から状態別に描画する
- [X] T015 [P] [US1] Clipboard成功・API不在・拒否と副作用なしを検証する失敗先行Unit Testを `tests/unit/agent-request-prompt-client.test.ts` に追加する
- [X] T016 [US1] Clipboard `writeText()` と `Copied`／手動コピー案内を `src/client/agent-request-prompt.ts` に実装し `src/client.ts` からQuestion画面だけで初期化する

**チェックポイント**: HumanがQuestionを明示選択し、安全な依頼Promptをコピーできる。

---

## Phase 4: ユーザーストーリー2 — ユーザーが指定したQuestionを読む (P1)

**目標**: 認証済みAgentがHuman指定の `OPEN` Questionだけを、固定instruction付きの未信頼DTOとして取得する。

**独立テスト**: 指定IDのOpen Questionだけが返り、Draft／Closed／Revealedは拒否され、作成者・回答数・本人状態・他者Answerは出力されない。

- [X] T017 [P] [US2] `get_question` の入力Schema、固定description、`readOnlyHint: true`、`untrustedContentHint: true`、AbortSignalを検証する失敗先行Unit Testを `tests/unit/register-get-question-tool.test.ts` に追加する
- [X] T018 [P] [US2] Question DTO、固定instruction契約、認証・状態・非公開フィールドを検証する失敗先行Integration Testを `tests/integration/webmcp-question-api.test.ts` に追加する
- [X] T019 [US2] `GET /api/questions/:questionId` をWebMCP Question契約へ更新し認証・`OPEN`・非列挙・no-storeを `src/routes/question.ts` と `src/app.tsx` に実装する
- [X] T020 [US2] `get_question` の厳密入力、同一Origin fetch、キャンセル、共通エラー保持を `src/webmcp/register-get-question-tool.ts` に実装する
- [X] T021 [US2] `get_question` を `src/client.ts` の本番Tool登録列へ追加し、US1のコピーPromptに含まれるQuestion URLを開いたページから指定IDを取得できる導線を `tests/integration/agent-request-prompt.test.ts` で確認する

**チェックポイント**: AgentはHuman指定Questionだけを読み、探索Capabilityを持たない。

---

## Phase 5: ユーザーストーリー3 — 独立したAnswerを1件投稿する (P1)

**目標**: 指定Questionへ本人Answerを1件だけ投稿し、表示文字・締切・重複・共通エラー契約を満たす。

**独立テスト**: Open Questionへの有効投稿だけが成功し、重複・同時10件・締切境界・無効入力・未認証が期待コードとなる。

- [X] T022 [P] [US3] `submit_answer` の新しい `INVALID_INPUT`／`TOOL_UNAVAILABLE`、表示文字Schema、annotation、キャンセルを `tests/unit/register-submit-answer-tool.test.ts` に失敗先行で追加する
- [X] T023 [P] [US3] 投稿成功、重複、同時10件、削除前の一意性、締切、認証、Draft非列挙を `tests/integration/answer-submission-api.test.ts` に失敗先行で追加する
- [X] T024 [US3] 投稿RouteとRepositoryを共通Domain契約、`updatedAt === createdAt`、安定した英語エラーへ更新するため `src/routes/submit-answer.ts` と `src/repositories/question-repository.ts` を実装する
- [X] T025 [US3] `submit_answer` のSchema、description、同一Origin fetch、AbortSignal、共通エラーを `src/webmcp/register-submit-answer-tool.ts` に同期する

**チェックポイント**: Human指定Questionへ独立Answerが1件だけ投稿される。

---

## Phase 6: ユーザーストーリー4 — 自分のAnswerを更新または削除する (P1)

**目標**: Humanの明示依頼時だけ、締切前の本人Answerを更新・削除し、削除後再投稿と競合安全性を成立させる。

**独立テスト**: 2利用者で本人更新・削除・削除後再投稿が成功し、他者操作・締切後操作・更新対削除競合・削除対再投稿競合が他者変更や複数Answerを生まない。

- [X] T026 [P] [US4] 本人限定update/remove、`updatedAt`、Hard Delete、削除後再投稿、締切境界、他者非変更、各10件の競合を `tests/d1/answer-mutation-repository.test.ts` に失敗先行で追加する
- [X] T027 [US4] 条件付きprepared `UPDATE`／`DELETE` と結果分類を `src/repositories/question-repository.ts` に実装し、remove後の遅延updateで復元しないことを保証する
- [X] T028 [P] [US4] `PUT`／`DELETE /api/questions/:questionId/my-answer` の成功、無効入力、未認証、Questionなし、本人Answerなし、締切、一時障害を `tests/integration/answer-mutation-api.test.ts` に失敗先行で追加する
- [X] T029 [US4] 更新・削除HTTP契約と英語エラー分類を `src/routes/answer-mutations.ts` に実装し `src/app.tsx` へ登録する
- [X] T030 [P] [US4] `update_answer` と `remove_answer` のSchema、Human明示依頼description、書き込みannotation、キャンセル、エラー保持を `tests/unit/register-update-answer-tool.test.ts` と `tests/unit/register-remove-answer-tool.test.ts` に失敗先行で追加する
- [X] T031 [P] [US4] `update_answer` の厳密入力と同一Origin PUTを `src/webmcp/register-update-answer-tool.ts` に実装する
- [X] T032 [US4] `remove_answer` の厳密入力と同一Origin DELETEを `src/webmcp/register-remove-answer-tool.ts` に実装し、両Toolを `src/client.ts` の登録列へ追加する

**チェックポイント**: 締切前の本人Answerだけが訂正・撤回でき、削除後に安全に再参加できる。

---

## Phase 7: ユーザーストーリー5 — 自分の投稿状況を確認する (P1)

**目標**: 投稿・更新・削除・締切後の各時点で、本人の最新状態だけを確認できる。

**独立テスト**: 更新後は最新本文と2時刻、削除後は `not_submitted`、別Userしか投稿していない場合も `not_submitted` が返る。

- [X] T033 [P] [US5] 未投稿、投稿済み、更新済み、削除済み、Closed、Revealed、別User投稿ありの本人DTOを `tests/integration/webmcp-question-api.test.ts` に失敗先行で追加する
- [X] T034 [US5] `get_my_submission` に本人の `submittedAt` と `updatedAt` を返し、Draft非列挙と他者状態非依存を `src/routes/question.ts` と `src/repositories/question-repository.ts` に実装する
- [X] T035 [US5] `get_my_submission` の未信頼annotation、厳密入力、キャンセル、更新後・削除後応答を `tests/unit/register-my-submission-tool.test.ts` と `src/webmcp/register-my-submission-tool.ts` に同期する

**チェックポイント**: Agentは本人の現在状態だけを確実に再確認できる。

---

## Phase 8: ユーザーストーリー6 — 一貫した安全なTool契約を利用する (P2)

**目標**: 5 Toolの公開面、認証、annotation、エラー、他者非露出・非変更を横断して固定する。

**独立テスト**: 利用可能Toolが5件だけで、2利用者・全Question状態・全Toolを組み合わせても他者情報露出と他者変更が0件になる。

- [X] T036 [P] [US6] 本番Toolが5件だけでQuestion探索・P0検証・他者Answer Toolが登録されない失敗先行テストを `tests/integration/verification-page.test.ts` と `tests/unit/register-tool.test.ts` に追加する
- [X] T037 [US6] P0検証用Toolと `who_am_i` のWebMCP登録を `src/client.ts` から外し、5 Toolの逐次登録、失敗status、英語description、annotationを最終化する
- [X] T038 [US6] 2利用者、Draft／Open／Closed／Revealed、5 Tool、直接HTTPを横断する他者Answer非露出・非変更回帰テストを `tests/integration/question-visibility.test.ts` と `tests/d1/answer-mutation-repository.test.ts` に追加する

**チェックポイント**: 最小CapabilityとSealed境界を持つ本番WebMCP面が完成する。

---

## Phase 9: 仕上げと横断検証

**目的**: 文書、品質ゲート、実ブラウザーE2E、完了記録を同期する。

- [X] T039 [P] `README.md`、`specs/007-webmcp-mvp-tools/quickstart.md`、`specs/007-webmcp-mvp-tools/validation-record.md` に5 Tool、Promptコピー、更新・削除・再投稿、2利用者、Injectionの安全な検証手順と結果欄を同期する
- [X] T040 `npm run typecheck`、`npm run lint`、`npm run format`、`npm test`、`npm run test:d1`、`npm run build`、`npm run db:schema:check` とQuickstartの実機E2Eを完了し、結果を `specs/007-webmcp-mvp-tools/validation-record.md`、`USE_CODEX.md`、成功時のみ `MILESTONE.md` に記録する

---

## Phase 10: Context根拠付き回答契約

- [X] T041 [P] 確定した1行Promptと `get_question` の固定Context instructionをUnit／Integration Testで固定する
- [X] T042 User自身の記述を優先し、Assistant提案・検討候補を事実とみなさず、根拠不足時はHumanへ質問して投稿しない汎用規則をTool description、Schema、返却データへ実装する。初回Promptは投稿許可を含み、追加Previewや承認は要求せず、投稿後は本人状態を確認する
- [X] T043 SPEC 007・009、README、MILESTONE、検証記録を確定契約へ同期し、全自動品質Gateを実行する

---

## 依存関係と実行順

### Phase依存関係

- **Phase 1**: 依存なし。
- **Phase 2**: Phase 1完了後。全ユーザーストーリーをブロックする。
- **US1 (Phase 3)**: Phase 2完了後に開始できる。
- **US2 (Phase 4)**: Phase 2完了後に開始できる。US1と統合するとコピペから取得まで確認できる。
- **US3 (Phase 5)**: Phase 2完了後に開始できる。US2完了後なら初回Promptの主経路を通せる。
- **US4 (Phase 6)**: Phase 2とUS3完了後。既存Answerを前提とする。
- **US5 (Phase 7)**: Phase 2完了後に開始できるが、更新後・削除後ケースはUS4に依存する。
- **US6 (Phase 8)**: US2〜US5完了後。5 Toolの横断面を固定する。
- **Phase 9**: 実装対象の全Story完了後。
- **Phase 10**: Phase 9完了後。確定したPromptとContext根拠契約を既存5 Toolへ反映する。

### ユーザーストーリー依存グラフ

```text
Foundation
├── US1 Prompt表示・コピー
├── US2 指定Question取得 ──> US3 初回投稿 ──> US4 更新・削除
│                                  └──────────> US5 本人状態
└────────────────────────────────────────────> US6 横断安全性
```

### Story内の順序

- 失敗先行テストを作成し、期待どおり失敗することを確認してから実装する。
- Domain／Schema／RepositoryをRouteより先に実装する。
- HTTP契約をWebMCP登録より先に成立させる。
- Storyの独立テストを通してから次の依存Storyへ進む。

## 並行実行例

### US1

```text
T011 Prompt Unit Test
T013 SSR表示Integration Test
T015 Clipboard Unit Test
```

### US2・US3

```text
T017 get_question Tool Test
T018 Question API Integration Test
T022 submit_answer Tool Test
T023 Submission API Integration Test
```

### US4

```text
T026 D1更新削除・競合Test
T028 HTTP更新削除Integration Test
T030 WebMCP更新削除Unit Test
```

### US5・US6

```text
T033 本人状態Integration Test
T036 5 Tool公開面Test
T038 他者非露出・非変更回帰Test
```

## 実装戦略

### 推奨MVP

HumanがQuestionを選んでAgentへ回答させる最小価値は、Phase 1〜2とUS1、US2、US3、US5で成立する。これによりPromptコピー、指定Question取得、1件投稿、本人確認が完成する。

### 段階的提供

1. Phase 1〜2でMigration・Domain・Repository基盤を固定する。
2. US1でHumanの明示起点を提供する。
3. US2・US3・US5で初回回答のE2Eを完成する。
4. US4で締切前の訂正・撤回・再投稿を追加する。
5. US6でTool面とSealed境界を横断固定する。
6. Phase 9で全品質ゲートと実機E2Eを完了する。
7. Phase 10でPrompt、Context根拠、根拠不足時の投稿停止、追加承認不要、投稿結果確認を同期する。

## タスク集計

| 区分 | タスク数 |
| --- | ---: |
| Setup | 3 |
| Foundational | 7 |
| US1 | 6 |
| US2 | 5 |
| US3 | 4 |
| US4 | 7 |
| US5 | 3 |
| US6 | 3 |
| Polish | 2 |
| Context契約 | 3 |
| **合計** | **43** |
