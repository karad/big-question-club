# タスク: ドメインデータモデルとQuestionライフサイクル

**入力**: `specs/005-domain-data-lifecycle/` の設計ドキュメント  
**前提**: [plan_ja.md](./plan_ja.md)、[spec_ja.md](./spec_ja.md)、[research_ja.md](./research_ja.md)、[data-model_ja.md](./data-model_ja.md)、[domain-persistence_ja.md](./contracts/domain-persistence_ja.md)、[quickstart_ja.md](./quickstart_ja.md)

**テスト**: 仕様、AGENTS.md、MILESTONE.mdがUnit Testと実D1 Integration Testを要求するため、各ユーザーストーリーでテストを実装より先に作成する。

**構成**: 各ユーザーストーリーを独立に実装・検証できるよう、Story単位でタスクを整理する。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクに依存せず、別ファイルで並行実行できる
- **[Story]**: 対応するユーザーストーリー（US1〜US4）
- すべてのタスクに対象ファイルパスを記載する

## Phase 1: Setup（共有基盤）

**目的**: DrizzleとD1実体テストを既存プロジェクトへ追加する。

- [X] T001 `drizzle-orm`、`drizzle-kit`、`@cloudflare/vitest-plugin`の互換バージョンと`test:d1`／Schema検査scriptをpackage.jsonとpackage-lock.jsonへ追加する
- [X] T002 [P] SQLite方言・src/db/schema.ts・既存Wrangler適用を前提にDrizzle Kitをdrizzle.config.tsへ設定する
- [X] T003 [P] 既存Nodeテストを維持したままtests/d1/*.test.tsだけをworkerdと分離D1で実行する設定をvitest.d1.config.tsへ追加する
- [X] T004 [P] D1テストbindingとCloudflare test APIの型をtests/d1/env.d.tsおよびtsconfig.jsonへ追加する

---

## Phase 2: Foundational（全Storyの前提）

**目的**: MigrationとDrizzle Repositoryを実D1上で検証できる共通部品を用意する。

**⚠️ CRITICAL**: このPhaseが完了するまでユーザーストーリー実装を開始しない。

- [X] T005 Wrangler Migrationを順序付きで読み、全件または指定範囲だけ分離D1へ適用できる共通helperをtests/d1/apply-migrations.tsへ追加する
- [X] T006 D1 Integration Test用のUser、Session、Question、Answer fixture factoryをtests/d1/fixtures.tsへ追加する
- [X] T007 D1Databaseから型付きDrizzle clientを作る薄いfactoryをsrc/db/client.tsへ追加する
- [X] T008 test bindingへ0001だけを適用してD1 read/writeが動くsmoke testをtests/d1/environment.test.tsへ追加し、Phase 1〜2の設定を検証する

**チェックポイント**: Nodeテストとは分離されたD1 Integration Testが実行可能。

---

## Phase 3: User Story 1 - Questionの現在状態を一意に判定する（優先度: P1）🎯 MVP

**目標**: 1つの純粋なDomain契約から `DRAFT`、`OPEN`、`CLOSED`、`REVEALED`を排他的に判定できる。

**独立テスト**: 固定`now`と20件以上の境界ケースをtests/unit/question-lifecycle.test.tsで実行し、期待状態との一致率100%、重複状態0件を確認する。

### User Story 1のテスト

- [X] T009 [P] [US1] DRAFT優先、OPEN、締切境界、CLOSED、Reveal境界、同時締切・Reveal、10回反復を含む20件以上の失敗する状態判定テストをtests/unit/question-lifecycle.test.tsへ追加する
- [X] T010 [P] [US1] 公開時刻・締切・Revealの順序、未来公開、許可・拒否遷移の失敗する境界テストをtests/unit/question-schedule.test.tsへ追加する

### User Story 1の実装

- [X] T011 [US1] creatorUserId、language、publishedAt、revealsAt、updatedAtとQuestionStateをsrc/domain/question.tsのDomain型へ追加する
- [X] T012 [US1] 状態判定、時刻順序検証、状態の後退検出を純粋関数としてsrc/domain/question-lifecycle.tsへ実装しT009・T010を成功させる
- [X] T013 [US1] 拡張したQuestion型と4状態fixtureをtests/helpers/question-repository.tsへ追加し既存テストデータを移行する
- [X] T014 [US1] 既存isOpen依存を共通QuestionState判定へ置き換え、締切後かつReveal前を公開しない回帰をsrc/routes/question.ts、src/routes/submit-answer.ts、tests/integration/question-visibility.test.tsへ反映する
- [X] T015 [US1] User Story 1のUnit／Integration Testを実行し、状態ケース数と結果をspecs/005-domain-data-lifecycle/validation-record.mdへ記録する

**チェックポイント**: D1永続化を変更しなくても4状態の契約を独立検証できる。

---

## Phase 4: User Story 2 - User、Session、Question、Answerを整合して保存する（優先度: P1）

**目標**: Drizzle Schema、D1制約、Repositoryを通して所有関係、一意性、参照整合性を維持する。

**独立テスト**: 分離D1へ2人のUser、Session、1 Question、2 Answerを保存し、関係を再取得でき、孤立参照と同一Userの2件目Answerが拒否されることを確認する。

### User Story 2のテスト

- [X] T016 [P] [US2] 空DBへ現行0001〜0003を適用するとissuer重複を検出する再現テストと修正後の成功条件をtests/d1/fresh-schema.test.tsへ追加する
- [X] T017 [P] [US2] Question／Answerの必須列、CHECK、外部キー、UNIQUE、削除規則を検証する失敗テストをtests/d1/domain-schema.test.tsへ追加する
- [X] T018 [P] [US2] Draft保存、公開、再取得、2 UserのAnswer、重複、孤立参照を検証する失敗テストをtests/d1/question-repository.test.tsへ追加する

### User Story 2の実装

- [X] T019 [US2] Local空DBとRemoteのd1_migrations適用状況およびQuestion／Answerが検証データだけであることを読み取り確認しspecs/005-domain-data-lifecycle/validation-record.mdへ記録する
- [X] T020 [US2] T019で0002の適用を確認後、issuer追加前の役割へmigrations/0001_better_auth.sqlを復元し、0001と0002の責務重複を解消する
- [X] T021 [US2] 認証4表を保持し、旧answers／questionsを外部キー順に本番用Schemaへ置換する差分をmigrations/0004_domain_data_lifecycle.sqlへ追加する
- [X] T022 [US2] User、Session、Account、Verification、Question、Answerの全列・CHECK・外部キー・UNIQUE・Indexをsrc/db/schema.tsへ定義し0001〜0004の到達点と一致させる
- [X] T023 [US2] getQuestion、createDraft、publish、submit、既存読み取り操作と安定した結果型をsrc/repositories/question-repository.tsへDrizzleで実装する
- [X] T024 [US2] Drizzle Repositoryを既存依存性注入へ接続し、ApplicationDatabasesとテストfakeをsrc/auth/session.ts、src/index.tsx、tests/helpers/question-repository.tsへ追従させる
- [X] T025 [US2] User Story 2のD1 Integration Testを実行し、関係・一意性・参照整合性の結果をspecs/005-domain-data-lifecycle/validation-record.mdへ記録する

**チェックポイント**: User Story 1と独立して、本番用Entity関係と制約を実D1で検証できる。

---

## Phase 5: User Story 3 - ライフサイクルに反する書き込みを拒否する（優先度: P2）

**目標**: 公開確定、Answer作成、エラー分類を条件付き書き込みで強制し、過去状態への後退と非OPEN投稿を確定させない。

**独立テスト**: 正常公開、不正時刻、二重公開、状態後退、DRAFT／CLOSED／REVEALED投稿、締切境界、同時10投稿を実D1で試し、正常な変更だけが確定することを確認する。

### User Story 3のテスト

- [X] T026 [P] [US3] 公開済みからDRAFT、CLOSED／REVEALEDからOPENへの後退を拒否する失敗テストをtests/unit/question-schedule.test.tsへ追加する
- [X] T027 [P] [US3] 条件付き公開、OPEN限定投稿、締切ちょうど、逐次10回、同時10件、制約error分類の失敗テストをtests/d1/question-write-guards.test.tsへ追加する

### User Story 3の実装

- [X] T028 [US3] 現在状態と提案時刻から許可遷移または英語のDomain error codeを返す処理をsrc/domain/question-lifecycle.tsへ追加する
- [X] T029 [US3] 公開を条件付きUPDATE、Answer作成をINSERT SELECTと一意制約で原子的に確定し、失敗理由を分類する処理をsrc/repositories/question-repository.tsへ追加する
- [X] T030 [US3] Route側の事前isOpen判定をRepository結果へ一本化し、既存英語error契約をsrc/routes/submit-answer.tsとsrc/domain/answer-submission.tsへ接続する
- [X] T031 [US3] CLOSEDではsealed、REVEALEDだけ公開となる共通判定へsrc/domain/answer-visibility.ts、src/routes/question.ts、tests/unit/answer-visibility.test.tsを更新する
- [X] T032 [US3] User Story 3のUnit／D1／既存API回帰テストを実行し、逐次・同時投稿と境界結果をspecs/005-domain-data-lifecycle/validation-record.mdへ記録する

**チェックポイント**: 不正遷移と非OPEN書き込みがどの呼び出し経路からも確定しない。

---

## Phase 6: User Story 4 - Migration後もデータ契約を検証できる（優先度: P3）

**目標**: 空DBとSPEC 004 DBの両経路、認証データ保持、失敗時rollback、Drizzle Schemaとの一致を自動検証できる。

**独立テスト**: freshとlegacyの分離D1へMigrationを適用し、User／Session保持、旧検証データ置換、全制約、失敗時の非部分適用を30分以内に確認する。

### User Story 4のテストと検証実装

- [X] T033 [P] [US4] 0001〜0003適用後のUser／Session／検証Question／Answerへ0004を適用し認証データだけを保持するテストをtests/d1/legacy-upgrade.test.tsへ追加する
- [X] T034 [P] [US4] 意図的に失敗するMigrationが部分Schemaや適用済み記録を残さないことをtests/d1/migration-rollback.test.tsへ追加する
- [X] T035 [US4] PRAGMAの列・外部キー・Index・CHECK結果とsrc/db/schema.tsの期待契約を照合する検証をtests/d1/schema-contract.test.tsへ追加する
- [X] T036 [US4] Local／Remote適用前確認、検証データ置換、export、停止条件をREADME.mdとspecs/005-domain-data-lifecycle/quickstart.mdへ反映する
- [X] T037 [US4] fresh／legacy／rollback／Schema契約を各10回実行し、所要時間と結果をspecs/005-domain-data-lifecycle/validation-record.mdへ記録する

**チェックポイント**: 2つのMigration経路を反復可能に検証でき、失敗を成功として扱わない。

---

## Phase 7: Polish & 横断的品質

**目的**: 全Storyを統合し、既存機能の回帰と文書の整合を確認する。

- [X] T038 [P] Drizzle Schema、Migration、Domain契約、Repository実装の差異をspecs/005-domain-data-lifecycle/data-model.mdとspecs/005-domain-data-lifecycle/contracts/domain-persistence.mdへ反映する
- [X] T039 npm test、npm run test:d1、npm run typecheck、npm run lint、npm run format、npm run buildを実行し結果をspecs/005-domain-data-lifecycle/validation-record.mdへ記録する
- [X] T040 全成功基準を満たした場合だけMILESTONE.mdのSPEC 005を完了にし、実装内容と検証結果をUSE_CODEX.mdへ追記する

---

## 依存関係と実行順序

### Phase依存関係

- **Setup（Phase 1）**: 依存なし。
- **Foundational（Phase 2）**: Setup完了後。全Storyをブロックする。
- **US1（Phase 3）**: Foundational完了後。DB Schema実装には依存しない。
- **US2（Phase 4）**: Foundational完了後。US1と並行可能。
- **US3（Phase 5）**: US1の状態契約とUS2のRepository／Schemaに依存する。
- **US4（Phase 6）**: US2の0004／Schemaに依存する。US3とは並行可能。
- **Polish（Phase 7）**: 実装対象とする全Storyの完了後。

### ユーザーストーリー依存グラフ

```text
Setup → Foundational ─┬→ US1 ─┐
                     └→ US2 ─┼→ US3 ─┐
                             └→ US4 ─┴→ Polish
```

### Story内の順序

- テストを先に作成し、対象実装前に期待どおり失敗することを確認する。
- Domain型／純粋関数をRepositoryより先に実装する。
- SchemaとMigrationをRepositoryの実D1接続より先に完成させる。
- RepositoryをRouteへ接続してから既存Integration Testを更新する。
- Storyの独立テストが成功してから次の依存Storyへ進む。

## 並行実行の機会

- T002、T003、T004は別ファイルのため並行可能。
- T009とT010、T016〜T018、T026とT027、T033とT034は各Storyの失敗テストとして並行可能。
- Foundational後、US1とUS2は別の主対象を持つため並行可能。
- US2完了後、US3とUS4は別ファイル中心のため並行可能。ただしvalidation-record.mdの更新は直列化する。
- T038はT039の品質ゲート前に独立して進められる。

## 並行実行例

### User Story 1

```text
Task T009: tests/unit/question-lifecycle.test.tsに状態境界テストを追加
Task T010: tests/unit/question-schedule.test.tsに時刻・遷移テストを追加
```

### User Story 2

```text
Task T016: tests/d1/fresh-schema.test.tsにfresh経路テストを追加
Task T017: tests/d1/domain-schema.test.tsに制約テストを追加
Task T018: tests/d1/question-repository.test.tsに関係テストを追加
```

### User Story 3

```text
Task T026: tests/unit/question-schedule.test.tsに状態後退テストを追加
Task T027: tests/d1/question-write-guards.test.tsに原子的書き込みテストを追加
```

### User Story 4

```text
Task T033: tests/d1/legacy-upgrade.test.tsにlegacy経路テストを追加
Task T034: tests/d1/migration-rollback.test.tsに失敗時rollbackテストを追加
```

## 実装戦略

### MVP First（User Story 1のみ）

1. Phase 1のSetupを完了する。
2. Phase 2のFoundationalを完了する。
3. Phase 3のUser Story 1を完了する。
4. 4状態・全境界を独立検証して停止する。

これにより、後続の保存・公開経路が参照する唯一の状態契約を先に確立できる。

### 段階的提供

1. Setup + Foundational → D1テスト基盤完成。
2. US1 → 4状態のDomain契約完成。
3. US2 → 本番用Schemaと整合した永続化完成。
4. US3 → 状態に反する書き込み拒否完成。
5. US4 → fresh／legacy Migration保証完成。
6. Polish → 全品質ゲートとMILESTONE完了判定。

## 注記

- `[P]`は別ファイルかつ未完了タスクへの依存がない作業だけに付ける。
- User／Sessionの書き込み責務はBetter Authに残し、Drizzle Adapterへの認証移行は行わない。
- Remote Migrationは自動実行しない。T019とQuickstartの停止条件を満たした後に別途判断する。
- 0001の修正はT019で適用台帳を確認した後だけ行い、既存Migrationの移動・改名は行わない。
- 各Storyのテストは実装前に失敗を確認し、Story完了時にvalidation-record.mdへ結果を残す。
