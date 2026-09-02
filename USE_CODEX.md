# Codex利用記録

## 2026-09-01

- `GPT-5`: 企画書・技術検証計画・技術仕様を確認し、MVP実装順のマイルストーンを`MILESTONE.md`へ作成した。
- `GPT-5`: SpecKitの各SPECをおおむね30〜40タスクで実装する前提に合わせ、マイルストーンを技術検証とMVP本実装の11 SPECへ再編した。
- `GPT-5`: SpecKitを用いてSPEC 001「実行基盤と最小WebMCP接続」の仕様と品質チェックリストを作成した。
- `GPT-5`: SPEC 001の技術調査、実装計画、データモデル、Tool契約、検証ガイド、依存順の実装タスクをSpecKitで作成した。
- `GPT-5`: SPEC 001のPhase 1を実装し、Cloudflare Workers・Hono・Vite・TypeScript・Vitestの開発基盤と検証用スクリプトを設定した。
- `GPT-5`: SPEC 001のPhase 2からPhase 5を実装し、固定Question API、WebMCP Tool登録、検証画面、Unit／Integration Test、再現手順を追加した。手動WebMCP E2Eと外部公開が必要なタスクは未完了として記録した。
- `GPT-5`: WebMCP Tool登録をインラインJavaScript文字列からViteでビルドする`src/client.ts`へ移し、HTMLが静的クライアントアセットを参照する構成へ変更した。
- `GPT-5`: Chrome DevToolsがTool実行時に実行オプションを省略するケースに対応し、`INVALID_ARGUMENT`の返却をユニットテストで固定した。
- `GPT-5`: 手動WebMCP E2Eの完了記録を反映し、SPEC 001のT035・T040とマイルストーンを完了に更新した。
- `GPT-5`: SpecKitを用いてSPEC 002「Google OAuthとWebMCPユーザー識別の検証」の仕様と品質チェックリストを作成した。
- `GPT-5`: SpecKitを用いてSPEC 002の技術調査、実装計画、認証データモデル、`who_am_i`契約、実機検証ガイドを作成した。
- `GPT-5`: SpecKitを用いてSPEC 002を40件の依存順タスクへ分解し、認証・WebMCP導線のテストとGo/No-Go検証を計画した。
- `GPT-5`: Google OAuthとCloudflare D1の実装前準備を、安全なSecret管理とリダイレクトURI登録を含む手順書としてSPEC 002へ追加した。
- `GPT-5`: SPEC 002のPhase 1でBetter Auth依存関係、Secretのローカルテンプレート、Git除外、認証検証のREADME導線を追加し、D1バインディングを要する作業は事前準備待ちとして保留した。
- `GPT-5`: SPEC 002の認証基盤、Better AuthのD1スキーマ、`who_am_i` API・WebMCP Tool・UI導線、Unit／Integration Test、Go/No-Go検証記録テンプレートを実装し、実機OAuth検証を保留として記録した。
- `GPT-5`: Google OAuth実機検証で判明したBetter Auth 1.7.2の`account.issuer`列不足をD1マイグレーションで修正し、同一アカウントの連続10回`who_am_i`確認を完了した。
- `GPT-5`: OAuth実機検証用に安全なログアウトUIを追加し、ログアウト後に`who_am_i`が識別子を返さず`AUTHENTICATION_REQUIRED`となることを確認した。
- `GPT-5`: Google OAuthの2アカウント実機検証で、各アカウント内の`who_am_i`安定性、画面との一致、アカウント分離、ログアウト後のアカウント切替を確認した。
- `GPT-5`: Google OAuthの認可拒否後に`who_am_i`が識別子を返さず`AUTHENTICATION_REQUIRED`となることを実機確認した。
- `GPT-5`: 検証用D1セッションを強制失効して未認証応答を確認し、SPEC 002の全受け入れ条件を満たすGo判定とマイルストーン完了を記録した。
- `GPT-5`: SpecKitを用いてSPEC 003「Personal Agent回答の安全性・言語の検証」の仕様と品質チェックリストを作成した。
- `GPT-5`: SpecKitを用いてSPEC 003の技術調査、実装計画、固定検証Questionのデータモデル、WebMCP契約、手動検証ガイドを作成した。
- `GPT-5`: SpecKitを用いてSPEC 003を40件の依存順タスクへ分解し、固定Question契約の自動テストと実Personal Agentによる手動Go/No-Go検証を計画した。
- `GPT-5`: SPEC 003のPhase 1で既存品質ゲートを確認し、WebMCPの読み取り専用・不信頼コンテンツannotation型と、既存認証導線を維持する同一オリジン境界を検証記録へ残した。
- `GPT-5`: SPEC 003のPhase 2〜5で、14件の安全性・言語検証Question、ケース別API、読み取り専用かつ不信頼コンテンツ標識付きWebMCP Tool、Unit／Integration Testを実装した。

## 2026-09-02

- `GPT-5.6`: SPEC 008のQuestion状態Snapshotを唯一の判定源とするAnswer認可決定表、回答数・本人Answer・Reveal後Excerpt・指定本文の最小Repository投影、SSR／詳細HTTP／WebMCPの非露出Headerと共通拒否を実装した。320件の認可マトリクスを含むNode 557テスト、D1 44テスト、型検査、Lint、Format、Build、Schema検査、および2利用者の実ブラウザーWebMCP／Reveal前後／Session失効検証に成功した。
- `GPT-5.6`: SpecKitを用いてSPEC 008の技術調査、実装計画、アクセス制御データモデル、SSR／HTTP／WebMCP契約、Quickstart検証ガイドを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 008を40件の依存順タスクへ分解し、Reveal前封印、回答数と本人Answer、Reveal後Human限定公開、直接アクセスと境界時刻の横断回帰を4ユーザーストーリーとして計画した。
- `GPT-5.6`: SpecKitを用いてSPEC 008「Sealed Answersのアクセス制御」の仕様と品質チェックリストを作成し、Question状態を唯一の判定源とする回答数・本人Answer・他者Answerの返却規則、SSR・HTTP API・WebMCPの経路別認可、直接アクセス対策、境界時刻、回帰テストマトリクスを定義した。
- `GPT-5.6`: SPEC 007の固定Agent依頼Prompt、Clipboard導線、指定Open Question取得、書記素制限付き投稿、本人Answer更新・Hard Delete・再投稿、本人状態確認、5 Tool限定登録、D1 Migrationと競合安全性を実装した。Node 229テスト、D1 42テスト、型検査、Lint、Format、Build、Schema検査、およびGoogle OAuth 2利用者のローカルWebMCP実機E2Eに成功し、他者Answer非露出・非変更、Draft非列挙、締切後凍結、日本語・英語のInjection耐性を確認した。
- `GPT-5.6`: SpecKitを用いてSPEC 007「WebMCP MVP Tool群」の仕様と品質チェックリストを作成し、Question画面の英語コピペ用プロンプトを起点にHumanが指定したQuestionだけを扱う5 Toolの入出力、締切前の本人Answer更新・削除、認証、エラー、文字数、安全なdescription、非公開データ境界、Integration Test成果を定義した。
- `GPT-5.6`: SpecKitを用いてSPEC 007の技術調査、実装計画、Answer更新時刻を含むD1データモデル、5 WebMCP Tool／HTTP／コピペ用Prompt契約、Quickstart検証ガイドを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 007を40件の依存順タスクへ分解し、Prompt UI、指定Question取得、投稿、本人Answer更新・削除・再投稿、本人状態、安全境界を6ユーザーストーリーとして計画した。
- `GPT-5.6`: SPEC 006のローカルD1・Google OAuth 2利用者手動検証を実施し、入力境界、Draft編集、不可逆な公開、4状態のMy Questions、所有者非列挙、Answer非露出、英語UIとキーボード導線を確認した。手動検証で発見した空の締切がUnix epoch表示になる問題を修正した。
- `GPT-5.6`: SPEC 006のQuestion作成・Draft編集・公開確認・不可逆な公開・My Questions・所有者非列挙・CSRF保護を実装し、書記素文字数と締切境界のUnit Test、SSR／認可Integration Test、D1競合・集計Testを追加した。
- `GPT-5.6`: SpecKitを用いてSPEC 006の技術調査、実装計画、Question管理データモデル、Human向けForm契約、検証ガイド、40件の依存順タスクを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 006「Question作成・公開フロー」の仕様と品質チェックリストを作成し、入力制約、英語・日本語の主言語、締切境界、初期Moderation、不可逆な公開、`My Questions`、権限外操作の拒否を定義した。
- `GPT-5.6`: SPEC 005の全40タスクを実装し、4状態のDomain契約、Drizzle全表Schema、fresh／legacy対応D1 Migration、条件付き公開と原子的Answer投稿、Remote適用前の安全手順を追加した。Node 118テスト、D1 21テスト、Migration系10回反復、型検査、Lint、Format、Build、Schema検査の成功を確認した。
- `GPT-5.6`: SpecKitを用いてSPEC 005「ドメインデータモデルとQuestionライフサイクル」の仕様と品質チェックリストを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 005の技術調査、実装計画、Drizzle／D1データモデル、内部永続化契約、Migration検証ガイドを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 005を40件の依存順タスクへ分解し、4状態のDomain契約、Drizzle Schema、D1 Migration、原子的書き込み、fresh／legacy検証を計画した。
- `GPT-5.6`: SpecKitを用いてSPEC 004「Agent回答投稿の完全性・Sealed Answersの検証」の仕様と品質チェックリストを作成した。
- `GPT-5.6`: SpecKitを用いてSPEC 004の技術調査、実装計画、D1データモデル、HTTP／SSR／WebMCP契約、検証ガイド、40件の依存順タスクを作成した。
- `GPT-5.6`: SPEC 004のAnswerに、AIが本文と同時に投稿する必須の1行Excerptを追加し、永続化、投稿契約、公開制御、検証、実装タスクへ反映した。
- `GPT-5.6`: SPEC 004の公開後回答一覧をExcerpt表示へ変更し、認証済みHumanのクリック時だけBodyを遅延取得する詳細APIと、表示期間外の非露出要件を設計・タスクへ反映した。
- `GPT-5.6`: SPEC 004のD1スキーマ、Answer／Excerpt入力検証、D1リポジトリ、認証済みAnswer投稿API、依存性注入の基盤を実装し、型検査と既存54テストの成功を確認した。
- `GPT-5.6`: SPEC 004のPhase 1を完了し、Question／Answer用D1バインディング、ローカル／共有マイグレーション導線、D1テスト補助を追加した。
- `GPT-5.6`: SPEC 004のPhase 2を完了し、認証・D1依存性境界、投稿・公開判定のUnit Test、D1書込み障害を重複投稿と誤認しない処理を追加した。
- `GPT-5.6`: SPEC 004の投稿・Sealed／Reveal画面・WebMCPの実装を完成させ、ExcerptのみのSSR初期表示、単一Answer Bodyの遅延取得、投稿・公開境界のUnit／Integration Test、検証文書を追加した。自動品質ゲートはすべて成功し、実機の2利用者WebMCP E2Eだけが未実施である。
- `GPT-5.6`: SPEC 004の実機E2E開始に向け、リモートD1へマイグレーション適用済みであることを確認し、締切前の検証用Questionを1件作成した。
- `GPT-5.6`: 実機WebMCPで後続Toolが見えない事象に対し、4 Toolの登録を並列から逐次処理へ変更し、書込みToolのannotationを明示した。型検査・Lint・85件のテストは成功した。
- `GPT-5.6`: SPEC 004のリモートD1を用いる2利用者手動E2Eで、投稿、重複拒否、締切前のSealed、未認証詳細API拒否、締切後のExcerpt一覧・単一Body展開、WebMCPの本人限定取得を確認し、SPECをGoとして完了した。
- `GPT-5`: SPEC 003の手動E2Eで通常の日本語Question `case-ja-01` を評価し、Private Context非出力・言語一致・関連回答を確認した。
- `GPT-5`: SPEC 003の期限内のCritical Go基準を6ケースへ更新し、日本語・英語の通常Questionと4類型の攻撃QuestionすべてでPrivate Context非出力・Injection不服従・言語一致を確認した。残り8ケースは後続回帰検証として維持した。
- `GPT-5`: SPEC 003で未実施の8件の回帰検証を、仕様内の未完了タスクからリポジトリ直下のバックログへ移管した。
