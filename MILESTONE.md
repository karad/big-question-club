# Big Question Club — MVPマイルストーン

このマイルストーンは、Challenge提出に必要な価値を優先し、各SPECを期限内に完了できる単位へ分割する。各SPECは、前のSPECの受け入れ条件を満たしてから着手する。完了時は先頭の`[ ]`を`[x]`に変更する。

## 運用ルール

- 各SPECはSpecKitで`spec.md`、`plan.md`、`tasks.md`を作成してから実装する。
- SpecKitで作成するドキュメントは日本語で記述する。
- `tasks.md`は、各SPECの期限と優先度に合わせて依存順タスクへ分解する。実装・テスト・ドキュメント・手動確認を含める。
- P0の技術検証SPECがGo判定に至るまで、P1以降の本実装SPECには着手しない。
- SPEC完了時には、受け入れ条件・テスト結果・未解決事項をSPECの`quickstart.md`または同等の検証記録に残す。

## P0 — 企画成立性の検証

- [x] **SPEC 001 — 実行基盤と最小WebMCP接続**
  - 目的: Cloudflare Workers、Hono、Viteを用意し、固定の検証用Questionを返す最小WebMCP Toolを実行できるようにする。
  - SpecKitで確定する情報: 対象ランタイム、ローカル開発・デプロイ方法、WebMCPの公開方法、環境変数、固定Questionの契約、手動接続確認手順。
  - 完了条件: Personal Agentから検証用Toolを呼び出し、固定Questionを取得できる。

- [x] **SPEC 002 — Google OAuthとWebMCPユーザー識別の検証**
  - 目的: Google OAuthでログインしたユーザーを、WebMCP Tool Callでも同一ユーザーとして識別できることを検証する。
  - SpecKitで確定する情報: Google CloudのOAuth同意画面・OAuthクライアント・承認済みリダイレクトURI、Better Auth設定、必要なSecret、Sessionの受け渡し方式、失敗時のGo/No-Go判断。
  - 完了条件: `who_am_i`相当のToolが、ブラウザとWebMCPで同一の認証済みユーザーを返す。

- [x] **SPEC 003 — Personal Agent回答の安全性・言語の検証**
  - 目的: Personal Contextを推論に利用しながらPrivate Contextを出力せず、Prompt Injectionに従わず、Questionと同一言語で回答できることを検証する。
  - SpecKitで確定する情報: 検証Question群、Tool description、untrusted contentの境界、漏えい・Injection・言語一致の判定基準、許容できない結果とGo/No-Go判断。
  - 完了条件: Critical Goとして選定した日本語・英語・4類型のInjection Question計6件で、定義した安全性と言語の成功基準を満たす。残り8件は後続の回帰検証として維持する。

- [x] **SPEC 004 — Agent回答投稿の完全性・Sealed Answersの検証**
  - 目的: 認証済みユーザーに1 Questionあたり1 Answerだけを許可し、締切までは他者のAnswer本文を全経路で非公開にできることを検証する。
  - SpecKitで確定する情報: 最小D1 Schema、`UNIQUE(question_id, user_id)`、重複・同時投稿の扱い、時刻境界、API・SSR・WebMCP別のアクセス方針、検証マトリクス。
  - 完了条件: 重複投稿が拒否され、Reveal前は本人以外のAnswer本文を取得できず、Reveal後に人間向け画面で確認できる。

## P1 — MVP本実装

- [x] **SPEC 005 — ドメインデータモデルとQuestionライフサイクル**
  - 目的: User、Question、Answer、Sessionを保存する本番用Schemaと、`DRAFT → OPEN → CLOSED → REVEALED`の状態遷移を実装する。
  - SpecKitで確定する情報: Drizzle Schema・Migration、各エンティティの責務、時刻の基準とタイムゾーン、状態遷移表、Repository境界、データ整合性ルール、単体テスト対象。
  - 完了条件: Migration済みDBで状態遷移と制約がテストされ、Questionの現在状態を一意に判定できる。

- [x] **SPEC 006 — Question作成・公開フロー**
  - 目的: 認証済みHumanがQuestion本文・回答締切を指定して作成し、公開可能なQuestionを管理できるようにする。回答言語はQuestion本文をもとにPersonal Agentが判断する。
  - SpecKitで確定する情報: 作成画面のユーザーストーリー、入力項目、文字数上限、言語指定方式、締切の制約、初期Moderation方針、エラー表示、My Questionsの必要範囲。
  - 完了条件: Question作成者が有効なQuestionを作成でき、無効な入力や権限外の操作が適切に拒否される。

- [x] **SPEC 007 — WebMCP MVP Tool群**
  - 目的: Question画面のコピペ用プロンプトを起点に、AgentがHumanの指定したOpen Questionを取得し、独立したAnswerを投稿・確認し、締切までは本人の依頼により更新・削除できる最小Tool群を提供する。
  - SpecKitで確定する情報: Question画面の英語コピペ用プロンプトとコピー操作、`get_question`、`submit_answer`、`update_answer`、`remove_answer`、`get_my_submission`の入出力契約、HumanによるQuestion指定、認可、エラー契約、文字数制限、Tool description、非公開データの除外、Integration Testのシナリオ。
  - 完了条件: 認証済みHumanがQuestion画面のプロンプトをPersonal Agentへ貼り付け、指定Questionについて投稿・確認まで完了し、締切前は本人Answerを更新・削除できる。AgentはQuestionを自動探索せず、他AgentのAnswerへアクセスまたは変更できない。

- [x] **SPEC 008 — Sealed Answersのアクセス制御**
  - 目的: Questionの状態を唯一の判定源として、Reveal前後のAnswer公開範囲をSSR・HTTP API・WebMCPで一貫して強制する。
  - SpecKitで確定する情報: アクセス制御ポリシー、回答数・自分のAnswer・他者のAnswerの返却ルール、直HTTPアクセス対策、境界時刻の扱い、回帰テストマトリクス。
  - 完了条件: 全公開経路のテストで、Reveal前に他者のAnswer本文・プレビュー・要約が一切漏れない。

- [ ] **SPEC 009 — Challenge Core閲覧フロー**
  - 目的: HomeとQuestion Detailの必須機能を完成し、HumanがOpen Questionを選び、Personal Agentへ回答を依頼し、回答数の変化とsealed状態を確認できるようにする。
  - SpecKitで確定する情報: Open Question一覧、回答数・締切・sealed表示、未ログイン・作成者・未回答・回答済みの最小表示状態、SPEC 007のAgent依頼プロンプト統合、SPEC 008の非露出回帰、自動テスト範囲。
  - 完了条件: 3分デモの回答前・1件回答・複数回答・sealedを機能として再現でき、Reveal前に他者Answerが漏れない。専用Login、My Questions再設計、最終Visual Designは含めない。
  - 追加SPEC : 理由 → Webアプリはインターネットに公開され、審査員の他誰でもアクセス可能になるため
    - ログイン、ログアウト、質問入力、回答入力を実施アカウントとともにDBにログとして記録する
    - 管理画面をつくる。管理アカウントは一人のみ。.env で指定する
    - 管理者以外のユーザーは管理画面にログインできない
    - 管理画面では、ユーザーの一覧、質問の一覧、回答の一覧、ログの閲覧が可能
    - 管理者は、質問の削除と回答の削除ができる。編集はできなくて良い
    - 管理画面からのユーザーのBANが可能

- [ ] **SPEC 010 — Reveal体験とChallenge Visual Design**
  - 目的: Reveal後に複数の独立回答の違いをHumanが明瞭に読めるようにし、Home・Question Detail・sealed・Revealを一貫した高品質な表現として完成させる。
  - SpecKitで確定する情報: Challengeで伝えるVisual Direction、Typography、Color、Layout、Motion、Responsive表現、Homeと回答期間中Detailの完成表示、Reveal後のAnswer一覧・本文表示・比較しやすい順序・空状態、英語文言、基本Accessibility、3分デモの画面遷移とUI／Integration Test。
  - 完了条件: 同じQuestionへの2件以上の異なるPersonal Agent回答について、`sealed → unsealed` の変化と回答の違いが3分デモで視覚的に伝わる。HomeからReveal結果までのCore画面が一貫したVisual品質を持ち、WebMCPからは他者Answerを取得できない。

## P2 — 時間があれば行う品質強化

- [ ] **SPEC 011 — 追加品質保証・提出強化（時間があれば）**
  - 目的: SPEC 009・010でChallenge提出に必要なCore体験が完成した後、残り時間で追加の品質保証、運用文書、提出素材を強化する。
  - SpecKitで確定する情報: 包括的Cross-browser／Accessibility／JavaScript無効検証、追加の障害・境界Matrix、デプロイ手順の精緻化、README・Quickstart拡充、追加スクリーンショットや提出文面改善、既知の制約。
  - 完了条件: 時間内に選択した追加品質項目が検証・記録される。本SPECはChallenge Core完成の必須条件にしない。

## P3 — 未確定アイデア

- ログは何かしらの方法で記録する。ベストプラクティスに従う
- 開発／検証用D1を用意し、利用ドキュメントを整備する


## 対象外

MVPでは、Agent同士の議論、Answerの投票・順位付け、合意形成機能、Answer要約、Personal Contextの保存、アプリケーション自身によるLLM利用を意図的に実装しない。
