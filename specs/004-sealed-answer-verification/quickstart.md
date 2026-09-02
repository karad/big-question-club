# 検証ガイド: Agent回答投稿の完全性・Sealed Answersの検証

## 前提条件

- SPEC 002・003がGo判定済みである。
- Node.js 22.13以上、npm、Cloudflare認証済みWrangler、WebMCP対応Chromeが使える。
- 区別できる検証用2利用者を用意し、Question・AnswerにPrivate Contextや認証情報を含めない。

## 自動確認

現行の`remote: true` D1バインディングでは、リモートD1へマイグレーションを適用後、`npm run dev`を起動し、次を実行する。

```sh
npm test
npm run typecheck
npm run lint
npm run format
```

| コマンド | 実行日 | 結果 |
| --- | --- | --- |
| `npm test` | 2026-09-02 | Pass（85 tests） |
| `npm run typecheck` | 2026-09-02 | Pass |
| `npm run lint` | 2026-09-02 | Pass |
| `npm run format` | 2026-09-02 | Pass |

## 手動E2E

1. 利用者Aで投稿後、さらに9回再投稿し、確定Answerが1件で重複が9件になることを確認する。
2. 未投稿Questionへ同時の投稿を10組送り、各組で成功1件・重複1件だけになることを確認する。
3. 締切直前、ちょうど、後に投稿を試み、直前だけが成功することを確認する。
4. A・Bが本文とExcerptを持つAnswerを同じQuestionに投稿し、締切前のSSR、HTTP API、WebMCPで他者Answer本文、Excerpt、抜粋、要約、識別子が出ないことを確認する。
5. 10件の有効投稿について、Excerptが必須・改行なし・160文字以内であることを確認する。
6. 締切後に認証済みHumanのSSR一覧で全AnswerのExcerptだけを確認し、Excerptクリック時だけ該当するBodyがその下へ展開されることを確認する。
7. 締切前または未認証でAnswer詳細APIを直接呼び出し、`ANSWER_UNAVAILABLE`だけが返り、本文・Excerpt・存在の手掛かりがないことを確認する。
8. 締切後もWebMCPから他者Answerが出ないことを確認する。
9. Answer 0件の締切後Questionで空状態だけが表示されることを確認する。

### 実行結果マトリクス

| ケース | 主体 | 経路 | 締切状態 | 期待結果 | 実行結果 | 合否 |
| --- | --- | --- | --- | --- | --- | --- |
| 再投稿 | 投稿者本人 | WebMCP | 締切前 | 1件成功・以後409 | `ANSWER_ALREADY_SUBMITTED` | Pass |
| 同時投稿 | 投稿者本人 | HTTP | 締切前 | 各組で1件だけ成功 | 自動テスト | Pass |
| Sealed | 別の認証済みHuman | SSR | 締切前 | 他者本文・Excerptなし | 他者情報なし | Pass |
| Sealed直接取得 | 未認証者 | HTTP | 締切前 | `ANSWER_UNAVAILABLE`だけ | `ANSWER_UNAVAILABLE` | Pass |
| Reveal一覧 | 認証済みHuman | SSR | 締切後 | Excerptだけを一覧表示 | Body初期表示なし | Pass |
| Reveal詳細 | 認証済みHuman | HTTP | 締切後 | 要求した1件のBodyだけ | クリックしたAnswerだけ取得 | Pass |
| Reveal WebMCP | Personal Agent | WebMCP | 締切後 | 他者Answerなし | 本人の`submitted`状態だけ | Pass |
| 空状態 | 認証済みHuman | SSR | 締切後 | 架空のAnswerなし | 自動テスト | Pass |

ケースID、主体、経路、締切前後、期待結果、合否だけを記録し、Answer本文、Cookie、トークン、OAuth情報、スクリーンショットを残さない。
