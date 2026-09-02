# 技術調査: ドメインデータモデルとQuestionライフサイクル

## 1. DrizzleとBetter Authの責務

**決定**: `drizzle-orm`をアプリケーションのD1アクセスと全テーブルの型付きSchemaに導入する。Better Authは現在のD1 binding直接接続を維持し、User／Session／Account／Verificationの書き込み責務を引き続きBetter Authだけに持たせる。

**理由**: DrizzleはCloudflare D1とWorkersを正式にサポートする。既存のBetter Auth接続はSPEC 002で実機検証済みであり、SPEC 005の目的に認証Adapter交換は含まれない。Drizzle Schemaに認証テーブルも含めれば、Question／Answerの外部キーとDB全体の型を1か所で確認しつつ、認証挙動の回帰リスクを避けられる。

**検討した代替案**:

- Better AuthもDrizzle Adapterへ切り替える案: このSPECに不要な認証経路変更と回帰範囲を増やすため採用しない。
- Question／AnswerだけをDrizzle Schemaへ含める案: DB全体の関係をSource of Truthとして表せないため採用しない。
- 生SQL Repositoryを維持する案: Schemaと照会型の乖離を防げないため採用しない。

**根拠**: [Drizzle Cloudflare D1 guide](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)、[Better Auth database guide](https://better-auth.com/docs/concepts/database)、[Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)

## 2. Drizzleのバージョンと時刻表現

**決定**: Better Auth 1.7のpeer互換範囲に含まれる安定版の `drizzle-orm` 0.45系と `drizzle-kit` 0.31系を採用し、SQLite方言を使用する。時刻列はSQLite `INTEGER`へUTC Unixミリ秒の `number` として保存する。

**理由**: 既存ドメインとD1 MigrationはUnixミリ秒の数値を使っており、`Date`への暗黙変換を増やさず移行できる。Drizzleの `timestamp_ms` modeはアプリケーション型を`Date`にするため、今回は `number` modeで既存契約を保つ。安定版を選び、プレリリース依存を持ち込まない。

**検討した代替案**:

- `timestamp_ms` mode: Domain全体の型変更が増えるため採用しない。
- ISO 8601文字列: 既存Migrationとの互換性が下がるため採用しない。
- Drizzle v1 RC: この機能にRC固有機能は不要なため採用しない。

**根拠**: [Drizzle SQLite column types](https://orm.drizzle.team/docs/sqlite/column-types)、[Drizzle timestamp guide](https://orm.drizzle.team/docs/guides/timestamp-default-value)、[Drizzle indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)

## 3. Migration履歴とDrizzle Kit

**決定**: 既にD1へ適用済みの `migrations/0001`〜`0003` の相対パスとWranglerの `d1_migrations` 台帳を維持し、最終Drizzle Schemaと一致するレビュー済み差分SQLを `migrations/0004_domain_data_lifecycle.sql` として追加する。Migrationの適用はWranglerへ一本化する。Drizzle KitはSchema設定と今後の差分生成に使用するが、既存履歴を移動・改名しない。

**理由**: WranglerはMigration名を適用済み識別子として記録する。DrizzleのMigration台帳とWranglerの台帳を併用すると適用状態が分裂する。CloudflareはDrizzleのネスト形式もサポートするが、既存トップレベル履歴を持つ現段階ではWranglerの1台帳を継続する方が安全である。最初の本番Schemaへの差分はlegacy table rebuildを含むため、人手でレビューする。

**検討した代替案**:

- 既存MigrationをDrizzleのネスト形式へ移す案: 適用済み名が変わるため採用しない。
- `drizzle-kit migrate`も併用する案: 2つのMigration台帳が生じるため採用しない。
- 新しいD1へ全データを移す案: 認証データ移送を伴い本SPECを超えるため採用しない。

**根拠**: [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)、[Drizzle Kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)

## 4. 既存Migrationの不整合

**決定**: 実装開始時にLocal空DBとRemoteの適用台帳を読み取り確認する。現行 `0001_better_auth.sql` と `0002_add_account_issuer.sql` がどちらも `issuer` 列を追加するため、0002が全対象環境で適用済みであることを確認したうえで、0001をissuer追加前のSchemaへ復元し、空DBで `0001 → 0002` が一度ずつ変更を適用する履歴に整える。

**理由**: 現在のファイルを空DBへ順に適用すると重複列で失敗し、FR-016を満たせない。一方、適用済みMigrationの意味を推測して変更するのも危険なため、D1台帳の確認を先行させる。0001を適用当時の内容へ戻す修正は、既存DBには再適用されず、新規DBの再現性だけを回復する。

**検討した代替案**:

- 0002を削除または空にする案: Remote台帳とrepository履歴の意味が失われるため採用しない。
- 0004で重複を吸収する案: 空DBは0002到達時点で失敗するため解決にならない。
- Localだけ特別な初期Schemaを使う案: 本番と検証のMigration経路が分かれるため採用しない。

## 5. 既存Question／Answerの移行

**決定**: 0004は認証テーブルを変更せず、SPEC 004の検証専用 `answers` と `questions` を外部キー順に置換して本番用構造を作る。共有環境へ適用する前に既存行が検証データだけであることを確認し、D1 exportまたはbackupで退避する。

**理由**: 既存Questionには作成者と主言語がなく、意味を損なわない一般的なbackfillを決められない。仕様は検証データの置換を許可する一方、User／Sessionの維持を要求している。

**検討した代替案**:

- 最初のUserを作成者にする: 所有者を捏造するため採用しない。
- 新しい列をnullableにする: 本番Schemaの契約を弱めるため採用しない。
- 認証テーブルも再作成する: User／Session保持要件に反するため採用しない。

**根拠**: [Cloudflare D1 import and export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)、[Cloudflare D1 migration foreign keys](https://developers.cloudflare.com/d1/reference/migrations/)

## 6. Question状態のSource of Truth

**決定**: 状態名はDBへ保存せず、`publishedAt`、`closesAt`、`revealsAt`、呼び出し側から渡す `now` から純粋関数で導出する。判定順は `publishedAt === null`、`now >= revealsAt`、`now >= closesAt`、それ以外の順とする。

**理由**: 保存状態と時刻から導ける状態を二重管理すると不一致が生じる。後の境界から先に評価すれば、締切とRevealが同時でも `REVEALED`だけを返す。固定 `now` により実時間待機なしに境界を反復検証できる。

**検討した代替案**:

- `status`列と定期更新: 二重管理と更新遅延が生じるため採用しない。
- `CLOSED`省略: 遅延Revealを表現できないため採用しない。
- クライアント時刻: 改ざんと経路間不一致が生じるため採用しない。

## 7. D1での原子的なAnswer作成

**決定**: Answer作成は、渡された同一の `now` に対してQuestionが公開済みかつ締切前である条件を含む単一の `INSERT ... SELECT ... WHERE ...` と、`UNIQUE(question_id, user_id)`、外部キー、CHECK制約で確定する。複数文が必要な操作だけD1 `batch()`を使用し、対話型Transactionを前提にしない。

**理由**: D1はauto-commitで、`batch()`は途中失敗時に全体をrollbackする。事前SELECT後の無条件INSERTより、書き込み文に状態条件を含める方が締切境界を原子的に扱える。一意制約は同時投稿の最終判定源となる。

**検討した代替案**:

- 読み取り後の無条件INSERT: 読み取りと書き込みの間に状態が変わるため採用しない。
- Worker内mutex: 複数Worker instance間で共有されないため採用しない。
- 対話型Transaction: D1の実行モデルと合わないため採用しない。

**根拠**: [D1 Database batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/)、[D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

## 8. D1 Schema／Migrationテスト

**決定**: 既存Nodeテストとは別に `vitest.d1.config.ts` を用意し、`@cloudflare/vitest-plugin` 1系の分離D1へ `readD1Migrations()` と `applyD1Migrations()` でMigrationを適用する。空DBへの全適用、0001〜0003適用後に認証データを入れたlegacy DBへの0004適用、制約、Repositoryを自動検証する。

**理由**: CloudflareはWorkersプロジェクトのUnit／Integration TestにWorkers Vitest統合を推奨し、workerdと分離ストレージでD1 bindingを直接テストできる。純粋関数は高速なNodeテストに残し、D1固有テストだけを分離すれば既存テスト環境を不用意に変更しない。

**検討した代替案**:

- D1完全mock: 外部キー、CHECK、Migration、同時書き込みを検証できないため採用しない。
- Remote D1だけの手動検証: 反復性と分離性が不足するため採用しない。
- 全テストをworkerdへ移す: 既存テストへの影響が大きいため採用しない。

**根拠**: [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)、[Workers Vitest configuration](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/)、[Workers Vitest D1 test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/)
