# SPEC 007 検証記録

## 実装前ベースライン

- 記録日: 2026-09-02
- Branch: `007-webmcp-mvp-tools`
- Node.js: `v24.5.0`
- 実装前Commitの登録Tool: `get_agent_safety_verification_question`、`who_am_i`、`submit_answer`、`get_my_submission` の4件
- `npm run typecheck`: 成功
- `npm run lint`: 成功
- `npm test`: 21 files、198 tests成功
- `npm run test:d1`: 9 files、36 tests成功
- `npm run build`: 成功。sandbox内ではWrangler log書込みのEPERM警告が出たが、成果物生成とcommand exitは成功

実装前結果は現在の作業ツリーを変更せず、`HEAD`を一時ディレクトリへ展開して確認した。

## 実装内容

- Question画面に、認証済み・未投稿・`OPEN` の場合だけ固定英語Promptとコピー操作を追加した。
- 本番WebMCP登録を `get_question`、`submit_answer`、`update_answer`、`remove_answer`、`get_my_submission` の5件へ限定した。
- `answers.updated_at` を追加し、既存Answerでは `created_at` から初期化するMigrationを追加した。
- Answer本文5,000、Excerpt 160の上限をUnicode書記素で検証し、D1は空白、Excerpt改行、一意性、参照整合性を保持する構成へ更新した。
- 締切前の本人限定更新・Hard Delete・削除後再投稿と、締切時点での変更凍結を条件付きD1書込みで実装した。
- 読み取り結果を本人状態または指定Open Questionに限定し、他者AnswerをWebMCPへ公開しない契約を維持した。

## 自動検証結果

- 実施日: 2026-09-02
- `npm run db:migrate:local`: `0005_answer_revisions.sql` 適用成功
- `npm run typecheck`: 成功
- `npm run lint`: 成功
- `npm run format`: 成功
- `npm test`: 29 files、229 tests成功
- `npm run test:d1`: 11 files、42 tests成功
- `npm run build`: 成功
- `npm run db:schema:check`: 成功

D1では既存Answer保持と `updatedAt` 初期化、書記素境界、本人限定更新・削除、他者非変更、締切境界、更新対削除および削除対再投稿の競合を確認した。Node側では固定Prompt、Clipboard成功・API不在・拒否、5 Toolだけの登録、Schema、annotation、AbortSignal、認証、Draft非列挙、共通エラー、SSR表示分岐を確認した。

## 実機E2E結果

- 実施日: 2026-09-02
- 環境: ローカルD1、WebMCP対応In-app Browser、Google OAuth検証用2アカウント
- 本番登録面が5 Toolだけで、P0検証Tool、`who_am_i`、探索・検索・他者Answer Toolが登録されないことを確認した。
- 未投稿Open Question画面で固定Promptを表示し、コピー結果と表示全文が一致して `Copied` となり、Injectionを含むQuestion本文がPromptへ混入しないことを確認した。
- Promptの指定IDだけで `get_question`、`submit_answer`、`get_my_submission` を順に実行し、初回投稿と本人状態確認が成功した。重複投稿は `ANSWER_ALREADY_SUBMITTED` となり、既存本文は変化しなかった。
- `update_answer` 後に本文、Excerpt、`updatedAt`だけが更新され、`submittedAt`が維持されることを確認した。
- 利用者確認後に `remove_answer` でローカル検証用AnswerをHard Deleteし、`not_submitted`、Prompt再表示、締切前の再投稿成功を確認した。
- アカウントBはAの投稿後も操作前に `not_submitted` となり、Bの投稿後もAの `get_my_submission` にBの本文・Excerpt・識別子・時刻が含まれないことを確認した。Aの更新後もBの保存内容と時刻が変化しないことをローカルD1で確認した。
- 締切後は `get_question`、`update_answer`、`remove_answer` がすべて `QUESTION_CLOSED` となり、`get_my_submission` の本人内容が変化しないことを確認した。
- 英語と日本語のInjection Questionで固定instruction 4項目、指定言語回答、秘密・以前の会話・認証情報の非出力を確認した。
- Clipboard API不在・拒否時の英語案内とPrompt維持はUnit Test、成功経路は実ブラウザーで確認した。

未解決事項はない。共有D1へのMigration適用およびデプロイは本SPECの実機検証では実施していない。
