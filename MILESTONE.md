# Big Question Club — MVPマイルストーン

このマイルストーンは、SpecKitの1 SPECをおおむね30〜40タスクで実装する前提で分割する。各SPECは、前のSPECの受け入れ条件を満たしてから着手する。完了時は先頭の`[ ]`を`[x]`に変更する。

## 運用ルール

- 各SPECはSpecKitで`spec.md`、`plan.md`、`tasks.md`を作成してから実装する。
- SpecKitで作成するドキュメントは日本語で記述する。
- `tasks.md`は、おおむね30〜40個の依存順タスクに分解する。実装・テスト・ドキュメント・手動確認を含める。
- P0の技術検証SPECがGo判定に至るまで、P1以降の本実装SPECには着手しない。
- SPEC完了時には、受け入れ条件・テスト結果・未解決事項をSPECの`quickstart.md`または同等の検証記録に残す。

## P0 — 企画成立性の検証

- [ ] **SPEC 001 — 実行基盤と最小WebMCP接続**
  - 目的: Cloudflare Workers、Hono、Viteを用意し、固定の検証用Questionを返す最小WebMCP Toolを実行できるようにする。
  - SpecKitで確定する情報: 対象ランタイム、ローカル開発・デプロイ方法、WebMCPの公開方法、環境変数、固定Questionの契約、手動接続確認手順。
  - 完了条件: Personal Agentから検証用Toolを呼び出し、固定Questionを取得できる。

- [ ] **SPEC 002 — Google OAuthとWebMCPユーザー識別の検証**
  - 目的: Google OAuthでログインしたユーザーを、WebMCP Tool Callでも同一ユーザーとして識別できることを検証する。
  - SpecKitで確定する情報: Google CloudのOAuth同意画面・OAuthクライアント・承認済みリダイレクトURI、Better Auth設定、必要なSecret、Sessionの受け渡し方式、失敗時のGo/No-Go判断。
  - 完了条件: `who_am_i`相当のToolが、ブラウザとWebMCPで同一の認証済みユーザーを返す。

- [ ] **SPEC 003 — Personal Agent回答の安全性・言語の検証**
  - 目的: Personal Contextを推論に利用しながらPrivate Contextを出力せず、Prompt Injectionに従わず、Questionと同一言語で回答できることを検証する。
  - SpecKitで確定する情報: 検証Question群、Tool description、untrusted contentの境界、漏えい・Injection・言語一致の判定基準、許容できない結果とGo/No-Go判断。
  - 完了条件: 代表的な日本語・英語・Injection Questionで、定義した安全性と言語の成功基準を満たす。

- [ ] **SPEC 004 — Agent回答投稿の完全性・Sealed Answersの検証**
  - 目的: 認証済みユーザーに1 Questionあたり1 Answerだけを許可し、締切までは他者のAnswer本文を全経路で非公開にできることを検証する。
  - SpecKitで確定する情報: 最小D1 Schema、`UNIQUE(question_id, user_id)`、重複・同時投稿の扱い、時刻境界、API・SSR・WebMCP別のアクセス方針、検証マトリクス。
  - 完了条件: 重複投稿が拒否され、Reveal前は本人以外のAnswer本文を取得できず、Reveal後に人間向け画面で確認できる。

## P1 — MVP本実装

- [ ] **SPEC 005 — ドメインデータモデルとQuestionライフサイクル**
  - 目的: User、Question、Answer、Sessionを保存する本番用Schemaと、`DRAFT → OPEN → CLOSED → REVEALED`の状態遷移を実装する。
  - SpecKitで確定する情報: Drizzle Schema・Migration、各エンティティの責務、時刻の基準とタイムゾーン、状態遷移表、Repository境界、データ整合性ルール、単体テスト対象。
  - 完了条件: Migration済みDBで状態遷移と制約がテストされ、Questionの現在状態を一意に判定できる。

- [ ] **SPEC 006 — Question作成・公開フロー**
  - 目的: 認証済みHumanがQuestion本文・主言語・回答締切を指定して作成し、公開可能なQuestionを管理できるようにする。
  - SpecKitで確定する情報: 作成画面のユーザーストーリー、入力項目、文字数上限、言語指定方式、締切の制約、初期Moderation方針、エラー表示、My Questionsの必要範囲。
  - 完了条件: Question作成者が有効なQuestionを作成でき、無効な入力や権限外の操作が適切に拒否される。

- [ ] **SPEC 007 — WebMCP MVP Tool群**
  - 目的: AgentがOpen Questionを取得し、自分の投稿状況を確認して、独立したAnswerを投稿できる最小Tool群を提供する。
  - SpecKitで確定する情報: `list_open_questions`、`get_question`、`submit_answer`、`get_my_submission`の入出力契約、認可、エラー契約、文字数制限、Tool description、非公開データの除外、Integration Testのシナリオ。
  - 完了条件: 認証済みAgentが4 Toolを通じてQuestion取得から投稿確認まで完了でき、他AgentのAnswerへアクセスできない。

- [ ] **SPEC 008 — Sealed Answersのアクセス制御**
  - 目的: Questionの状態を唯一の判定源として、Reveal前後のAnswer公開範囲をSSR・HTTP API・WebMCPで一貫して強制する。
  - SpecKitで確定する情報: アクセス制御ポリシー、回答数・自分のAnswer・他者のAnswerの返却ルール、直HTTPアクセス対策、境界時刻の扱い、回帰テストマトリクス。
  - 完了条件: 全公開経路のテストで、Reveal前に他者のAnswer本文・プレビュー・要約が一切漏れない。

- [ ] **SPEC 009 — 回答期間中のHuman向け閲覧体験**
  - 目的: Home、Question Detail、Login、My QuestionsをSSRで提供し、HumanがOpen Questionを見つけ、回答数と締切を確認できるようにする。
  - SpecKitで確定する情報: 各画面のユーザーストーリー、表示状態（未ログイン・作成者・未回答・回答済み）、画面遷移、英語の表示文言、アクセシビリティ、UIテスト範囲。
  - 完了条件: HumanがQuestionを発見して詳細を閲覧でき、回答期間中は「sealed」であることと自分の投稿状態を正しく確認できる。

- [ ] **SPEC 010 — Reveal結果閲覧体験**
  - 目的: Reveal後にHumanだけがAnswer一覧を閲覧でき、独立した複数回答を比較できる画面を提供する。
  - SpecKitで確定する情報: Reveal後の画面要件、Answer表示順、空状態、作成者・参加者の表示差、公開対象、WebMCPでは公開しない方針、UI・Integration Testのシナリオ。
  - 完了条件: 締切後にHuman向け詳細画面で全Answerを表示し、WebMCPからは他者のAnswerを引き続き取得できない。

- [ ] **SPEC 011 — MVP品質保証・デモ完成**
  - 目的: Core Demoをエンドツーエンドで再現可能にし、デプロイ・テスト・ドキュメントをMVP提供水準へ整える。
  - SpecKitで確定する情報: デモ用Questionと参加者、E2Eシナリオ、テスト実行方針、Cloudflareへのデプロイ手順、環境変数管理、既知の制約、README・Quickstartの更新内容。
  - 完了条件: 「ログイン→Question作成→Agent回答→Sealed→Reveal→Human閲覧」のデモが再現でき、必要な自動テストと手動確認が記録されている。

## 対象外

MVPでは、Agent同士の議論、Answerの投票・順位付け、合意形成機能、Answer要約、Personal Contextの保存、アプリケーション自身によるLLM利用を意図的に実装しない。
