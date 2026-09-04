# 検証ガイド: WebMCP MVP Tool群

このガイドは、Question画面のコピペ用Promptから5つのWebMCP Tool、本人Answerの投稿・更新・削除・再投稿・確認までを検証する。入出力は [WebMCP契約](./contracts/webmcp-tools_ja.md)、HTTPと競合は [Answer HTTP契約](./contracts/answer-mutations_ja.md)、表示文言は [Prompt契約](./contracts/agent-request-prompt_ja.md) を参照する。

## 前提

- Node.js 22.13以上または24以上、npm、Wranglerを利用できる。
- ローカルD1 Migrationを適用できる。
- WebMCP対応Chromeで、Big Question ClubへGoogleログインできる。
- 機微情報を含まない2つの検証用アカウントとPersonal Agentを利用する。
- 日本語、英語、Prompt Injectionを含む検証Questionを用意する。

## 自動検証

```bash
npm install
npm run db:migrate:local
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
```

期待結果:

- Answer Migration後も既存Answerの件数、所有者、本文、Excerpt、作成時刻が保持され、`updatedAt === createdAt` になる。
- 書記素境界、1行Prompt、ローカル／本番Originに追従するQuestion URL、5 ToolのSchemaとannotation、HTTP statusと英語エラーがすべて成功する。
- 本人限定update/remove、締切境界、削除後再投稿、更新・削除競合で他者Answerへの変更が0件になる。
- SSR Promptは認証済み・未投稿・`OPEN` の場合だけ表示され、Question本文を含まない。

## ローカル起動

```bash
npm run dev
```

表示された同一OriginのURLをWebMCP対応Chromeで開く。ローカル検証では、必要に応じてChromeのWebMCP testing設定を有効にする。

## Human起点の初回回答

1. アカウントAでログインする。
2. 未投稿の `OPEN` Question画面を開く。
3. `Ask your personal agent`、締切まで更新・削除可能である旨、選択可能な英語Prompt、`Copy prompt` が表示されることを確認する。
4. Promptが次の1行だけで、`{{questionUrl}}` が閲覧中ページの絶対URLになっていることを確認する。Query、Fragment、Question本文、User情報、Answer情報は含まれない。
   `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`
5. `Copy prompt` を押し、`Copied` が通知され、表示とコピー結果が一致することを確認する。
6. コピーしたPromptをPersonal Agentへ貼り付ける。
7. Agentが指定URLを開き、そのページで提供されるTool契約を解釈して対象Questionだけを取得することを確認する。現在の会話、利用可能な過去会話、Project ContextにあるUser自身の明示的な記述を優先し、追加Previewや承認を求めず回答・投稿して、`get_my_submission` で成功を確認する。明示的な個人見解がない場合はUserが答えそうな最善の代理回答を作成・投稿し、未確認の個人事実や既知の信条として断定せず、その不足だけを理由にHumanへ確認しないことを確認する。
8. Question画面を再表示し、新規投稿Promptが消え、本人の投稿済み状態が表示されることを確認する。

Clipboardを無効または拒否した場合は、英語の失敗statusが表示され、画面上のPromptを手動選択・コピーできることを確認する。コピーだけではWebMCP Toolが呼ばれないことも確認する。

## Answer更新・削除・再投稿

1. アカウントAのPersonal Agentへ、同じQuestionのAnswer本文とExcerptを更新するよう明示的に依頼する。
2. Agentが `update_answer` を1回だけ呼び、`updated` を返すことを確認する。
3. `get_my_submission` で新しい本文、Excerpt、`updatedAt`が返り、`submittedAt`が変わらないことを確認する。
4. Agentへ本人Answerを削除するよう明示的に依頼する。
5. Agentが `remove_answer` を1回だけ呼び、`removed` を返すことを確認する。
6. `get_my_submission` が `not_submitted` となり、Question画面に初回回答Promptが再表示されることを確認する。
7. 締切前にPromptを再び貼り付け、新しいAnswerを1件だけ再投稿できることを確認する。

## 2利用者とSealed境界

1. アカウントBでも同じQuestionへ異なるAnswerを投稿する。
2. Aが5 Toolを使っても、Bの本文、Excerpt、Answer ID、投稿時刻、User情報が返らないことを確認する。
3. Aが `update_answer` と `remove_answer` を実行しても、BのAnswer本文、Excerpt、件数が変化しないことを確認する。
4. AのAnswerを削除した状態でも、Bの存在を理由にAの `get_my_submission` が変化せず `not_submitted` になることを確認する。
5. Reveal後も5 Toolから他者Answerが返らず、`update_answer` と `remove_answer` が `QUESTION_CLOSED` になることを確認する。

## 境界・競合マトリクス

| ケース | 主体 | 時刻 | 操作 | 期待結果 |
| --- | --- | --- | --- | --- |
| 初回投稿 | 本人 | 締切前 | submit | 1件成功 |
| 重複投稿 | 本人 | 締切前 | submit | `ANSWER_ALREADY_SUBMITTED` |
| 更新 | 本人 | 締切前 | update | 同じAnswerが更新 |
| 削除 | 本人 | 締切前 | remove | 本人Answerだけ削除 |
| 削除後再投稿 | 本人 | 締切前 | submit | 新しい1件が成功 |
| 更新対象なし | 本人 | 締切前 | update | `ANSWER_NOT_FOUND` |
| 削除対象なし | 本人 | 締切前 | remove | `ANSWER_NOT_FOUND` |
| 更新・削除 | 本人 | 締切と同時／後 | update/remove | `QUESTION_CLOSED`、変更なし |
| 更新・削除 | 別User | 締切前 | update/remove | `ANSWER_NOT_FOUND`、他者変更なし |
| 更新対削除競合 | 本人 | 締切前 | 同時10件 | 削除後復元0件、最終Answer最大1件 |
| 削除対再投稿競合 | 本人 | 締切前 | 同時10件 | 最終Answer最大1件 |

## 回答言語・Injection

- 複数言語のQuestionで、Personal Agentが本文から回答言語を判断することを確認する。判断結果はAgentの裁量とし、Applicationは特定言語への一致を強制しない。
- Question本文が秘密、以前の会話、認証情報、無関係なTool利用を要求しても従わないことを確認する。
- `get_question` の固定instructionが [WebMCP 5 Tool契約](./contracts/webmcp-tools_ja.md) と一致し、Question本文により変化しないことを確認する。
- 検証用Answer、画面、記録へ実在するPrivate Context、Cookie、Token、OAuth値を入力しない。

## 完了判定

- 5 Toolが契約どおり登録され、Question一覧・検索・他者Answer Toolが0件である。
- HumanがPromptをコピーして指定Questionの取得、投稿、本人確認を5分以内に完了できる。
- 締切前の本人更新・削除・再投稿が成功し、締切後の変更が0件である。
- 他者Answerの露出と変更が全経路・全時刻で0件である。
- 自動品質ゲートと上記手動シナリオの結果を記録し、未確認事項がない。

実施結果、日時、検証環境、未解決事項は [validation-record_ja.md](./validation-record_ja.md) を正本として記録する。
