# 実装計画: 回答公開体験とチャレンジ向け視覚設計

**ブランチ**: `010-reveal-visual-design` | **日付**: 2026-09-03 | **仕様**: [spec_ja.md](./spec_ja.md)

**入力**: `specs/010-reveal-visual-design/spec.md`の機能仕様

## 概要

既存のCloudflare Workers・Hono JSX・D1・Vite構成とSPEC 008・009の非公開境界を維持しながら、回答公開後の要約文一覧と本文遅延取得を比較しやすい画面へ完成させる。認証済み利用者には一覧Cardと詳細で本人が回答済みの場合だけ緑色の`Answered` Tagを示し、公開前は本人回答だけを再確認できるようにする。公開結果には認証済みアカウントから1件ずつ投稿されたことを明示し、利用者情報ではなく質問識別子と回答識別子から生成する質問単位の匿名アイコンを添え、本人回答だけを`Your answer`で識別する。ホームには回答受付中5件と公開済み10件、状態別一覧には20件単位のページ移動を追加する。質問作成は下書き保存と即時公開を分け、一意な作成トークンと処理中制御で二重実行を防ぐ。所有者削除は監査記録と質問削除を同一処理にする。視覚面はTailwind CSS 4系、React Icons由来の生成済み静的SVG、共通レイアウト、英語表示、画面幅対応、キーボード操作、動きの低減で統一する。

## 技術コンテキスト

**言語・バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発・資材生成時）、ES2022

**主要依存関係**: 既存のCloudflare Workers、Hono、Hono JSX、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Vitest 4、WebMCP Imperative API。追加するのはTailwind CSS 4系、公式Viteプラグイン、React Icons 5系、およびアイコン生成時だけ使うReact・React DOM。

**保存先**: 既存Cloudflare D1の`questions`、`answers`、`audit_logs`を使用する。新しい表・列・索引は追加しない。所有者削除では新しい監査操作値`QUESTION_DELETED`を記録する。

**テスト**: 日時初期値・ページ指定・本人回答状態Tag・作成意図・二重送信制御・質問単位匿名アイコン・WebMCP代理回答descriptionの単体テスト、ホーム・状態別一覧・質問詳細・公開前の本人回答限定表示・公開結果の本人回答Tag・作成・公開・削除・WebMCP回答instructionのHono結合テスト、一覧投影・公開回答の本人判定・所有者条件付き削除・監査・連鎖削除のD1結合テスト、生成アイコン・CSS資材・既存WebMCP非露出の回帰テスト。

**対象基盤**: Cloudflare Workers、Cloudflare D1、WebMCP対応Chrome、モダンブラウザー、ローカルMiniflare／workerd。

**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。

**性能目標**: ローカル検証でホーム、状態別一覧、質問詳細の初期HTMLを各2秒以内に返す。ホームは状態別に上限付きの集計取得を行い、質問ごとの逐次問い合わせを発生させない。初期HTMLへ公開回答本文を含めない。

**制約**: 1要求でサービス時刻を1回だけ取得する。`OPEN`と`CLOSED`では他者回答を取得・表示・埋め込みしない。`REVEALED`でも他者回答は認証済み人向け経路だけに限定し、WebMCPへ返さない。利用者別応答は`private, no-store`とする。一般利用者向け匿名アイコンには利用者ID、Google表示名、Googleプロフィール画像、生のハッシュ値を使わず、質問を横断する永続識別子を追加しない。すべての画面スタイルをTailwind CSSで記述し、状態・操作アイコンはReact Icons由来に限定する。利用者入力をSVGや生HTMLとして扱わない。画面文言・コメント・識別子は英語、SpecKit成果物は日本語とする。

**規模・範囲**: 6ユーザーストーリー、ホーム2区分、状態別一覧2画面、1ページ20件のページ移動、回答公開比較、質問作成2意図、所有者削除、共通視覚部品、クライアント操作、単体・HTTP・D1回帰、3分デモ検証。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 再利用される日時初期値、ページ指定、表示判断、作成意図は純粋関数として単体テストで境界を固定する。
- 質問一覧、本人回答有無、所有者削除、監査記録はD1を唯一の正本とし、D1結合テストで保証する。
- 認証からSSR、ページ移動、回答本文遅延取得、作成・公開・削除の導線は結合テストで保証する。
- 画面側の送信無効化だけに依存せず、一意な作成トークンと保存先制約で再送を安全にする。
- 所有者削除の認可はセッション由来利用者と保存済み所有者を比較し、要求入力の利用者IDを信用しない。
- 回答本文・要約文・質問本文は未信頼文字列として扱い、React Icons由来の固定SVGだけを信頼済み生成資材とする。
- SPEC 008・009の回答非露出、要求時刻の一貫性、下書きと不存在の非識別性を後退させない。
- 新しい監査操作値を既存の追記専用監査へ追加し、本文・要約文・認証情報を記録しない。
- 画面文言・コメント・識別子は英語、SpecKit成果物は日本語とし、重要判断は`USE_CODEX.md`へ記録する。

**第0段階前の判定**: 適合。Tailwind CSSの生成、React IconsとHono JSXの境界、一覧投影、遅延回答表示、二重実行防止、所有者削除、ローカル翌日0時の扱いを技術調査で解決する。

**第1段階後の判定**: 適合。新しい永続化構造を増やさず、限定された資材生成、既存リポジトリの投影・条件付き変更、共通SSR部品、段階的機能強化、単体・HTTP・D1テストにより全ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/010-reveal-visual-design/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── browsing-and-reveal.md
│   └── question-management.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### ソースコード

```text
scripts/
└── generate-icons.mjs

src/
├── app.tsx
├── client.ts
├── styles.css
├── domain/
│   ├── admin.ts
│   ├── question-browsing.ts
│   ├── question-deadline.ts
│   └── question-listing.ts
├── generated/
│   └── icons.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   ├── home.tsx
│   ├── question.ts
│   ├── question-list.tsx
│   └── question-management.tsx
├── ui/
│   ├── agent-prompt-clipboard.ts
│   ├── deadline-display.ts
│   ├── form-submission-guard.ts
│   ├── question-list.ts
│   └── revealed-answers.ts
└── views/
    ├── icon.tsx
    ├── layout.tsx
    ├── home.tsx
    ├── question-card.tsx
    ├── question-detail.tsx
    ├── question-list.tsx
    ├── question-management.tsx
    └── site-header.tsx

tests/
├── d1/
│   ├── question-browsing-repository.test.ts
│   └── question-management-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── assets.test.ts
│   ├── challenge-demo.test.ts
│   ├── home.test.ts
│   ├── question-browsing.test.ts
│   ├── question-list.test.ts
│   ├── question-management.test.ts
│   └── question-visibility.test.ts
└── unit/
    ├── form-submission-guard.test.ts
    ├── icon.test.ts
    ├── question-deadline.test.ts
    ├── question-list.test.ts
    ├── question-listing.test.ts
    └── revealed-answers.test.ts
```

**構成判断**: 既存の単一Worker、Hono JSX SSR、経路・画面・リポジトリ分割を維持する。全画面共通の資材参照と骨格は`layout.tsx`、質問項目の表示は`question-card.tsx`、状態別一覧は専用経路と画面、ブラウザー操作は責務別の`src/ui/`へ置く。React Iconsは`generate-icons.mjs`から`src/generated/icons.ts`へ固定SVGを生成し、画面は`icon.tsx`だけを通じて利用する。

## 複雑性の追跡

| 追加する複雑性 | 必要な理由 | 採用しなかった単純案 |
| --- | --- | --- |
| React Iconsの静的SVG生成 | React専用部品をHono JSX SSRへ安全に取り込み、WorkerへReact実行環境を含めず明示要件を満たすため | React Iconsの直接利用は要素型が非互換で、React全面移行は範囲が大きすぎる |
| 作成トークンによる再送制御 | ダブルクリックだけでなくフォーム再送や通信再試行でも質問を1件に保つため | ボタン無効化だけでは直接再送を防げない |
