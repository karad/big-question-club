# 実装計画: Agent回答投稿の完全性・Sealed Answersの検証

**ブランチ**: `004-sealed-answer-verification` | **日付**: 2026-09-02 | **仕様**: [spec_ja.md](./spec_ja.md)

## 概要

認証済み利用者が締切前のQuestionに本文と1行Excerptを持つAnswerを1件だけ投稿でき、締切まで他者Answerを全経路で秘匿し、締切後は認証済みHuman向け画面だけで全Answerを閲覧できることを検証する。D1の`UNIQUE(question_id, user_id)`を最終的な重複判定源にし、Worker側時刻と共通の公開判定をSSR、HTTP API、WebMCPで共有する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上（開発時）、ES2022  
**主要依存関係**: Cloudflare Workers、Hono 4、Vite 8、Better Auth、Cloudflare D1、Vitest 4  
**保存先**: Cloudflare D1。既存の認証テーブルに`questions`と`answers`を追加する。  
**テスト**: VitestのUnit／Integration Test、WebMCP ToolのUnit Test、認証済み2利用者による手動E2E。  
**対象プラットフォーム**: Cloudflare Workers、D1、ChromeのWebMCP対応環境。  
**プロジェクト種別**: SSRを含む単一Webアプリケーション。  
**性能目標**: 各操作を検証環境で2秒以内に完了し、10組の同時投稿で各組の確定Answerを1件に保つ。  
**制約**: 投稿者はセッションからだけ決定し、Excerptは必須・改行なし・160文字以内とする。締切判定はWorker側時刻だけで行う。締切前は他者Answer本文・Excerpt・抜粋・要約・存在の手掛かりを全経路で返さない。締切後のSSR一覧はExcerptだけを表示し、認証済みHumanのクリックにより同一OriginのAnswer詳細APIから該当Bodyだけを展開する。WebMCPは締切後も他者Answerを返さない。D1照会はprepared statementを使う。  
**規模/範囲**: 検証用Question、2利用者、投稿・重複・同時投稿・締切境界・3公開経路を対象にする。Question作成、編集、投票、要約、未認証公開は対象外。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`と仕様をゲートとする。

- D1一意制約、時刻境界、入力、公開範囲をUnit Testで固定する。
- API、SSR、WebMCPの導線をIntegration Testで保証する。
- 2利用者・締切前後・3経路の手動E2Eを行い、秘密情報を記録しない。
- 表示文言、コメント、識別子は英語にする。

**Phase 0後／Phase 1後の判定**: 適合。データベース制約を最終判定源とし、他者Answerを返すAPIやToolを設けない。

**完了判定（2026-09-02）**: 適合。リモートD1を用いる2利用者の手動E2Eで投稿、重複拒否、Sealed、Reveal、WebMCPの本人限定取得を確認し、自動品質ゲートも成功した。

## プロジェクト構成

```text
specs/004-sealed-answer-verification/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── answer-submission.md
│   └── question-visibility.md
└── tasks.md

migrations/0003_add_questions_and_answers.sql
src/{app.tsx,client.ts}
src/domain/{question.ts,answer-submission.ts,answer-visibility.ts}
src/repositories/question-repository.ts
src/routes/{question.ts,submit-answer.ts}
src/webmcp/{register-submit-answer-tool.ts,register-my-submission-tool.ts}
tests/{unit,integration}/
```

**構成判断**: 単一Workerを維持する。`domain/`の共通判定と`repositories/`のD1アクセスを、SSR、HTTP API、WebMCPが共有する。

## 複雑性の追跡

違反なし。
