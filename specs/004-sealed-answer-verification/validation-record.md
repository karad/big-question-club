# 検証記録: Agent回答投稿の完全性・Sealed Answersの検証

**実施日**: 2026-09-02  
**実施者**: Codex、検証実施者  
**検証環境**: ローカルWorker（リモートD1）、WebMCP対応Chrome  
**総合判定**: Go

> Answer本文、Excerpt、Cookie、トークン、OAuth情報、スクリーンショットを記録しない。

## 自動検証

| 確認項目 | 結果 | 備考 |
| --- | --- | --- |
| Unit／Integration Test | Pass | 17 files、85 tests |
| TypeScript型検査 | Pass | `npm run typecheck` |
| Lint | Pass | `npm run lint` |
| Format | Pass | `npm run format` |

## 成功基準と自動テストの対応

| 成功基準 | 自動テスト |
| --- | --- |
| SC-001、SC-002 | `tests/integration/answer-submission-api.test.ts` の再投稿・10並行投稿 |
| SC-003 | `tests/integration/answer-submission-api.test.ts` のWorker時刻境界 |
| SC-004 | `tests/integration/question-visibility.test.ts` のSealed SSR／HTTP／本人状態API |
| SC-005 | `tests/integration/question-visibility.test.ts` のReveal SSRと単一詳細API |
| SC-007 | `tests/unit/answer-submission.test.ts` のExcerpt入力境界 |

## 手動E2Eマトリクス

| 主体 | 経路 | 締切状態 | 期待結果 | 合否 |
| --- | --- | --- | --- | --- |
| 投稿者本人 | WebMCP | 締切前 | 1件だけ投稿できる | Pass（投稿済みの再投稿は`ANSWER_ALREADY_SUBMITTED`） |
| 別の認証済みHuman | SSR | 締切前 | 他者本文・Excerptなし | Pass |
| 認証済みHuman | SSR | 締切後 | Excerpt一覧とクリックした1件の本文だけ | Pass |
| 未認証者 | Answer詳細API | 締切前後 | `ANSWER_UNAVAILABLE`だけ | Pass（締切前・未認証で確認） |
| Personal Agent | WebMCP | 締切後 | 他者Answerなし | Pass（`get_my_submission`は本人状態のみ） |

## Go/No-Go

- 1 Question・1利用者につき確定Answerが1件だけであること。
- 締切前の他者Answer本文・Excerpt露出が0件であること。
- 締切後は認証済みHumanのクリックした1件だけが詳細APIから取得できること。
- WebMCPが他者Answerを返さないこと。

すべて満たした。10並行投稿、締切境界、空状態、Excerpt入力境界は自動テストで確認した。
