# 実装計画: Challenge Core閲覧フロー

**ブランチ**: `009-answer-period-browsing` | **日付**: 2026-09-02 | **仕様**: [spec.md](./spec.md)

**入力**: `specs/009-answer-period-browsing/spec.md` の機能仕様

## 概要

WebMCP ChallengeのCore Demoと公開運用の最低限を完成させるため、既存の単一Worker構成を維持し、HomeのOpen Question一覧、Question Detailの回答期間中状態、単一管理者向け管理画面、監査記録、コンテンツ削除、User BANを追加・整理する。SPEC 007のChatGPT組み込みブラウザ指定と既存Chrome Tab除外、現在のOriginへ追従するQuestion絶対URL入り確定済み1行Agent依頼Promptと、User自身の記述を優先し、明示的な個人見解がない場合は未確認の個人事実や既知の信条として断定しない最善の代理回答を作成・投稿するWebMCP instruction、SPEC 008のAnswer認可・Reveal最小表示を再利用する。個人見解不足だけを理由に確認質問をせず、初回Promptは投稿許可を含み追加Previewや承認は不要とする。管理者Emailは環境設定、認可はSession由来User、監査とBANはD1を正本としてUnit・HTTP・D1 Testで固定する。最終Visual DesignとReveal比較表現は必須のSPEC 010へ移す。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022
**主要依存関係**: 既存のCloudflare Workers、Hono、Hono JSX、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Vitest 4、WebMCP Imperative API。新規依存は追加しない。
**保存先**: 既存Cloudflare D1の `user`、`session`、`questions`、`answers` に、`banned_users`、`audit_logs` と操作記録TriggerをMigrationで追加する。
**テスト**: 表示状態・締切・回答数・管理設定のUnit Test、Home／Question Detail／管理認可・操作のHono Integration Test、Open一覧・監査・削除・BANのD1 Integration Test、既存SPEC 007・008回帰。
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、WebMCP対応Chrome、モダンブラウザー、ローカルMiniflare／workerd。
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。
**性能目標**: ローカル検証でHomeとQuestion Detailの初期HTMLを各2秒以内に返し、Home一覧を1回の集計Queryで取得する。
**制約**: 1要求でサービス時刻を1回だけ取得する。`OPEN` と `CLOSED` では一般画面へ他者Answerを取得・表示・埋め込みしない。管理画面と操作は環境設定Emailに一致する1人だけへ許可し、認可後はprivate no-storeにする。一般画面から管理画面へLinkせず、未認証・権限外・設定不備には通常の404を返す。監査記録へ本文・Excerpt・認証秘密を複製しない。BAN時はSessionを失効し、Session作成HookでもBANを拒否する。`REVEALED` はSPEC 008を後退させない。アプリ表示文言・コメント・識別子は英語、SpecKit文書は日本語とする。
**規模/範囲**: 9ユーザーストーリー、Home、Question Detail、管理画面、4管理一覧、Question／Answer削除、User BAN／解除、監査記録、認可・障害状態。Visual Design、専用Login、My Questions再設計、複数Role、包括的Accessibilityは対象外。

## 構成原則チェック

`constitution.md` は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 表示状態、回答数単複、残り時間はUnit Test可能な純粋関数として境界を固定する。
- Question状態は既存 `getQuestionState`、本人はBetter Auth Session、永続化は既存RepositoryとD1を唯一のSource of Truthとする。
- Open一覧の絞り込み・順序・集計はD1 Integration Test、認証からSSRまでの導線はIntegration Testで保証する。
- RouteはUser IDを入力から受けず、Session由来本人と要求単位のサービス時刻だけで表示状態を決める。
- Home投影にAnswer本文・Excerpt・Userを含めず、Question本文と本人Answerを未信頼テキストとして扱う。
- 既存SPEC 007・008の安全契約を再利用し、短期都合で弱めない。
- 管理者判定はEmailの入力値やURL parameterを信用せず、環境設定とSession UserのDB情報をRepositoryで比較する。
- Login／LogoutとQuestion／Answer変更はDB Triggerで監査し、Route追加漏れや直接Repository利用でも記録を落とさない。
- 管理削除・BANは対象変更と監査記録を同一D1 Batchへ含め、部分成功を避ける。
- BANは既存Session削除と新規Session作成前Hookの両方で強制する。
- アプリ表示文言、コメント、識別子は英語、SpecKit成果物は日本語で作成し、重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。Open一覧、状態Snapshot、閲覧者状態、既存認証導線、SPEC境界、テスト分担をPhase 0で解決する。

**Phase 1後の判定**: 適合。新規依存なし、追記型監査とBANの最小Schema、Session由来認可、既存Route／Viewの限定変更、Unit／HTTP／D1回帰により全ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/009-answer-period-browsing/
├── spec.md
├── plan.md
├── architecture.md
├── user-manual.md
├── admin-manual.md
├── developer-manual.md
├── migration-manual.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-record.md
├── contracts/
│   └── core-browsing.md
│   └── admin-operations.md
└── tasks.md
```

### ソースコード

```text
src/
├── app.tsx
├── auth/
│   └── auth.ts
├── db/
│   └── schema.ts
├── domain/
│   ├── admin.ts
│   └── question-browsing.ts
├── repositories/
│   ├── admin-repository.ts
│   └── question-repository.ts
├── routes/
│   ├── admin.tsx
│   ├── home.tsx
│   └── question.ts
└── views/
    ├── admin.tsx
    ├── home.tsx
    └── question-detail.tsx

tests/
├── d1/
│   ├── admin-repository.test.ts
│   └── question-browsing-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── admin.test.ts
│   ├── home.test.ts
│   ├── question-browsing.test.ts
│   └── question-visibility.test.ts
└── unit/
    ├── admin.test.ts
    └── question-browsing.test.ts
```

**構成判断**: 既存の単一WorkerとRoute分割を維持する。画面非依存の表示値はDomain、一般Question操作は既存Repository、管理投影・変更は専用Admin Repository、HTTP認可はAdmin Route、SSRは画面別Viewへ置く。Better AuthのSession lifecycle HookとD1 Triggerを監査・BAN境界に使い、大規模な共通Layout化、Client再設計、別の認証方式は追加しない。

## 複雑性の追跡

違反なし。新規依存やServiceを追加しない。`banned_users` と `audit_logs`、必要なIndex・Triggerを1 Migrationで追加する複雑性は、公開アプリの利用停止と追記型監査をDB正本で保証するために必要である。専用Admin Repository／Route／Viewは一般閲覧の非露出境界と管理者だけの全件投影を分離する最小構成である。
