# タスク: Sealed Answersのアクセス制御

**入力**: `specs/008-sealed-answer-access/` の設計文書  
**前提**: [plan_ja.md](./plan_ja.md)、[spec_ja.md](./spec_ja.md)、[research_ja.md](./research_ja.md)、[data-model_ja.md](./data-model_ja.md)、[contracts/](./contracts/)、[quickstart_ja.md](./quickstart_ja.md)

**テスト方針**: 分岐の多い認可決定表はUnit Test、認証・SSR・HTTP・WebMCP導線はIntegration Test、Repository投影とQuestion間分離はD1 Integration Testで失敗先行にする。最後に2利用者と実ブラウザーでQuickstartを確認する。

**構成**: 4ユーザーストーリーを独立検証可能なPhaseに分け、全40タスクを依存順に実行する。

## Phase 1: セットアップと現状固定

**目的**: SPEC 004〜007の既存Sealed Answers契約を壊さず、SPEC 008の検証記録と共通fixtureを準備する。

- [X] T001 現在のブランチ、Node／D1テスト、型検査、Lint、Format、Build、Schema Checkの基準結果を `specs/008-sealed-answer-access/validation-record.md` に記録する
- [X] T002 [P] 5主体・4状態・3経路・3情報種別を列挙する認可fixtureを `tests/helpers/visibility-matrix.ts` に追加する
- [X] T003 [P] 2利用者、作成者、Draft／Open／Closed／Revealed、0件／複数Answer、別Questionのfixtureを `tests/helpers/question-repository.ts` に追加する

---

## Phase 2: 共通認可基盤

**目的**: 全Storyが使う認可入力、状態Snapshot、安全な投影、利用者依存応答Headerを確立する。

**⚠️ 重要**: このPhaseが完了するまでユーザーストーリー実装へ進まない。

- [X] T004 [P] 認証・Route用途・Question状態・情報種別の型と期待決定表を `tests/unit/answer-visibility.test.ts` に失敗先行で追加する
- [X] T005 `src/domain/answer-visibility.ts` に `answer-count`、`own-answer`、`other-excerpts`、`other-body` の純粋なアクセス決定表を実装する
- [X] T006 [P] 利用者依存の成功・失敗に `private, no-store` と `Vary: Cookie` を要求する共通期待値を `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T007 利用者依存応答Headerの共通生成を `src/routes/question.ts` に実装し、Question画面・本人状態・Answer詳細の全分岐へ適用する
- [X] T008 [P] 回答数、本人Answer、Reveal後Excerpt、指定本文だけを表す投影型とRepository契約を `src/repositories/question-repository.ts` に定義する
- [X] T009 `tests/helpers/question-repository.ts` のIn-memory Repositoryを新しい投影契約とQuestion間分離へ対応させる

**チェックポイント**: すべての公開経路が同じ決定表、状態Snapshot、投影、Header契約を利用できる。

---

## Phase 3: ユーザーストーリー1 — Reveal前の他者Answerを全経路で封印する (P1) 🎯

**目標**: `DRAFT`、`OPEN`、`CLOSED` で、作成者を含む全主体と全公開経路から他者Answerを完全に封印する。

**独立テスト**: 2利用者の識別可能な秘密値を持つAnswerを用意し、Reveal前のSSR、直接HTTP、WebMCP互換経路で本人以外の本文、Excerpt、ID、User、個別時刻が0件であることを確認する。

- [X] T010 [P] [US1] `DRAFT`／`OPEN`／`CLOSED` と未認証・作成者・本人・別Human・WebMCPの拒否組み合わせを `tests/unit/answer-visibility.test.ts` に失敗先行で追加する
- [X] T011 [P] [US1] Reveal前SSRに回答数と本人Answerだけがあり他者秘密値がHTML本文・属性・Scriptへないことを `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T012 [P] [US1] 実在・不在・別QuestionのAnswer詳細がReveal前に同じ `404 ANSWER_UNAVAILABLE` となることを `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T013 [US1] 1要求で `now()` を1回だけ評価したQuestion状態SnapshotからSSRと詳細認可を行うよう `src/routes/question.ts` を実装する
- [X] T014 [US1] Reveal前のQuestion画面へ本人Answerだけを安全なテキストとして描画し他者投影を呼ばないよう `src/routes/question.ts` と `src/views/question-detail.tsx` を実装する
- [X] T015 [US1] Answer詳細を認可成功後だけ取得し実在・不在・別Questionを共通拒否へ畳むよう `src/routes/question.ts` を実装する
- [X] T016 [US1] Question作成者にもReveal前特権がなくDraftを公開経路で非列挙にする回帰ケースを `tests/integration/question-management.test.ts` と `tests/integration/question-visibility.test.ts` に追加する

**チェックポイント**: Reveal前の他者Answer露出が全経路で0件になる。

---

## Phase 4: ユーザーストーリー2 — 回答数と本人Answerを必要な範囲だけ確認する (P1)

**目標**: Humanは公開済みQuestionの回答数と本人Answer、WebMCPは本人状態だけを全公開状態で安全に確認できる。

**独立テスト**: 他者だけが投稿済みの場合も本人の未投稿応答が一定で、Human SSRは正しい回答数、WebMCPは回答数なし、投稿者本人は3状態で最新Answerを取得できる。

- [X] T017 [P] [US2] `OPEN`／`CLOSED`／`REVEALED` の回答数と本人投影、未投稿応答の他者非依存を `tests/unit/answer-visibility.test.ts` に失敗先行で追加する
- [X] T018 [P] [US2] 0件／複数件の回答数と本人・別UserのAnswer投影を `tests/d1/answer-visibility-repository.test.ts` に失敗先行で追加する
- [X] T019 [US2] 回答数とSession User本人だけを取得する最小投影を `src/repositories/question-repository.ts` に実装する
- [X] T020 [P] [US2] Human SSRが3状態で正しい回答数と本人Answerを返すことを `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T021 [P] [US2] `get_my_submission` が3状態で本人だけを返し他者件数で形を変えないことを `tests/integration/webmcp-question-api.test.ts` に失敗先行で追加する
- [X] T022 [US2] `src/routes/question.ts` のQuestion画面と本人状態Routeを最小投影へ移行し、WebMCP互換応答から回答数と他者情報を除外する

**チェックポイント**: Humanの参加確認とWebMCP本人限定契約が他者情報を混入せず成立する。

---

## Phase 5: ユーザーストーリー3 — Reveal後は認証済みHumanだけが全Answerを読む (P1)

**目標**: `REVEALED` で認証済みHumanだけが全Excerptと選択本文1件を取得し、未認証者とWebMCPには公開しない。

**独立テスト**: Reveal後SSRの全Excerpt、初期本文0件、選択本文1件、空状態、未認証拒否、WebMCP他者情報0件を確認する。

- [X] T023 [P] [US3] `REVEALED` のHuman SSR／詳細だけを許可し未認証・WebMCPを拒否する決定表を `tests/unit/answer-visibility.test.ts` に失敗先行で追加する
- [X] T024 [P] [US3] 安定順の `{ id, excerpt }` と指定Question内の `{ id, body }` だけを返すD1投影を `tests/d1/answer-visibility-repository.test.ts` に失敗先行で追加する
- [X] T025 [US3] Reveal後Excerpt一覧とQuestionに限定した本文1件の最小投影を `src/repositories/question-repository.ts` に実装する
- [X] T026 [P] [US3] Reveal後SSRのExcerpt全件・本文0件・空状態・危険文字escapeを `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T027 [P] [US3] Reveal後詳細の指定本文1件・別Question拒否・未認証共通拒否を `tests/integration/question-visibility.test.ts` に失敗先行で追加する
- [X] T028 [US3] `src/routes/question.ts` と `src/views/question-detail.tsx` にReveal後Excerpt一覧、本文遅延取得、空状態、未信頼テキスト描画を実装する
- [X] T029 [US3] Reveal後も5 WebMCP Toolに回答数・他者Answer Capabilityがないことを `tests/unit/register-production-tools.test.ts` と `tests/integration/webmcp-question-api.test.ts` に追加する

**チェックポイント**: Reveal後のHuman限定公開とWebMCP本人限定が同時に成立する。

---

## Phase 6: ユーザーストーリー4 — 直接アクセスと境界時刻を回帰検証する (P2)

**目標**: 全マトリクス、境界時刻、異常Method、認証失効、Session切替を反復可能に検証する。

**独立テスト**: 180組以上の基礎マトリクスと追加攻撃ケースが100%一致し、秘密値露出と利用者間混入が0件である。

- [X] T030 [P] [US4] 5主体・4状態・3経路・3情報種別の全組み合わせを `tests/helpers/visibility-matrix.ts` から実行するUnit Testを `tests/unit/answer-visibility.test.ts` に追加する
- [X] T031 [P] [US4] 締切／Revealの直前・同時刻・直後と1要求1回の時刻評価を `tests/integration/question-visibility.test.ts` に追加する
- [X] T032 [P] [US4] HEAD・未対応Method・不正ID・過剰QueryでAnswer情報が返らないことを `tests/integration/question-visibility.test.ts` に追加する
- [X] T033 [P] [US4] 実在・不在・別Questionの拒否結果を各10回比較する回帰テストを `tests/integration/question-visibility.test.ts` に追加する
- [X] T034 [P] [US4] 認証失効とA／B Session切替で本人Answer混入が0件であることを `tests/integration/question-visibility.test.ts` に追加する
- [X] T035 [US4] `src/app.tsx` と `src/routes/question.ts` の未対応経路・例外・認証失効応答を共通非露出HeaderとBodyへ統一する
- [X] T036 [US4] D1実データで全状態・本人・他者・別Questionの投影境界を横断検証するケースを `tests/d1/answer-visibility-repository.test.ts` に追加する

**チェックポイント**: 回帰マトリクスが将来のRoute追加・境界変更・直接アクセスによる漏えいを検出できる。

---

## Phase 7: 仕上げと横断検証

**目的**: 文書、品質ゲート、実ブラウザーE2E、完了記録を同期する。

- [X] T037 [P] `README.md` にQuestion状態を唯一の判定源とするHuman／WebMCP公開境界とSPEC 008検証導線を追記する
- [X] T038 [P] `specs/008-sealed-answer-access/quickstart.md` と `specs/008-sealed-answer-access/validation-record.md` を実装済みRoute、Header、テスト名、手動マトリクスへ同期する
- [X] T039 `npm run typecheck`、`npm run lint`、`npm run format`、`npm test`、`npm run test:d1`、`npm run build`、`npm run db:schema:check` を完了し結果を `specs/008-sealed-answer-access/validation-record.md` に記録する
- [X] T040 Quickstartの2利用者・Reveal前後・直接HTTP・WebMCP・Session切替を完了し、結果を `specs/008-sealed-answer-access/validation-record.md`、`USE_CODEX.md`、成功時のみ `MILESTONE.md` に記録する

---

## 依存関係と実行順

### Phase依存関係

- **Phase 1**: 依存なし。
- **Phase 2**: Phase 1完了後。全Storyをブロックする。
- **US1**: Phase 2完了後。Reveal前の基本境界を成立させる。
- **US2**: Phase 2完了後に独立開始可能。SSR統合はUS1のRoute変更と調整する。
- **US3**: Phase 2完了後に独立開始可能。最終統合はUS1の拒否境界とUS2の投影を利用する。
- **US4**: US1〜US3完了後。横断回帰を固定する。
- **Phase 7**: 全Story完了後。

### ユーザーストーリー依存グラフ

```text
Foundation
├── US1 Reveal前封印 ──┐
├── US2 count + own ───┼──> US4 横断回帰
└── US3 Human reveal ──┘
```

### Story内の順序

- 失敗先行テストを作り、期待どおり失敗してから実装する。
- Domain決定表とRepository投影をRoute／Viewより先に実装する。
- 独立テストを通してから横断回帰へ進む。

## 並行実行例

### US1

```text
T010 Domain拒否表
T011 SSR非露出
T012 詳細非列挙
```

### US2

```text
T018 D1本人投影
T020 Human SSR
T021 WebMCP本人状態
```

### US3

```text
T024 D1 Reveal投影
T026 SSR Excerpt
T027 詳細本文
```

### US4

```text
T031 境界時刻
T032 異常Method
T033 非列挙反復
T034 Session切替
```

## 実装戦略

### 推奨MVP

Phase 1〜2とUS1を先に完了し、Reveal前の全経路非露出を独立検証する。これがSealed Answersの最小安全価値である。

### 段階的提供

1. SetupとFoundationで決定表・投影・Headerを固定する。
2. US1でReveal前封印を完成する。
3. US2で回答数と本人確認を安全に提供する。
4. US3でReveal後Human限定公開を完成する。
5. US4で全経路・境界・直接アクセスを横断固定する。
6. Phase 7で品質ゲートと実機E2Eを完了する。

## タスク集計

| 区分 | タスク数 |
| --- | ---: |
| Setup | 3 |
| Foundational | 6 |
| US1 | 7 |
| US2 | 6 |
| US3 | 7 |
| US4 | 7 |
| Polish | 4 |
| **合計** | **40** |
