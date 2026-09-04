# 管理ユーザー向けマニュアル

## 管理画面へ入る

1. 管理者として設定されたGoogleアカウントでログインします。
2. `/club-operations`を直接開きます。一般画面には管理画面へのリンクはありません。

管理者は1人だけです。未ログイン、管理者以外のアカウント、設定不備では、管理画面の存在を示さない通常の404が表示されます。

初回公開前の設定は[D1マイグレーション手順](./migration-manual_ja.md)を参照してください。

## 一覧を確認する

管理画面トップには件数Summaryと、次の専用一覧ページへのLinkがあります。トップには個別Recordを表示しません。

- `/club-operations/users`
- `/club-operations/questions`
- `/club-operations/answers`
- `/club-operations/audit-log`

各一覧は1ページ20件のTable形式で表示し、`Previous`と`Next`でページを移動します。横幅が狭い場合は、いずれもTable内だけを横へ移動できます。
画面上の日付と時刻は`YYYY-MM-DD HH:mm`形式で表示します。

- User: 名前、Email、BAN状態、登録時刻
- Question: 本文、作成者、状態、作成・更新時刻
- Answer: 本文、Excerpt、Question、回答者、作成・更新時刻
- Audit log: 操作者、操作、対象、結果、発生時刻

QuestionとAnswerの内容は管理上必要な場合に限って取り扱ってください。Audit logにはQuestion本文、Answer本文、認証情報は保存されません。

## QuestionまたはAnswerを削除する

QuestionまたはAnswer一覧で、対象行の確認欄を選択してから`Delete`を実行します。

- Questionを削除すると、そのQuestionに属するAnswerも削除されます。
- Answerの削除では、Questionと他のAnswerは残ります。
- 削除した内容は管理画面から復元できません。
- 編集機能はありません。

対象IDと内容を確認してから実行してください。操作記録はAudit logに残ります。

## UserをBANまたは解除する

User一覧で、対象Userの確認欄を選択してから`Ban`を実行します。BANすると、そのUserの既存ログイン状態は失効し、新しいログインも拒否されます。

`Unban`を実行すると、次回から再びログインできます。過去のログイン状態は復元されません。管理者自身はBANできません。

## Audit logを確認する

問題調査では、発生時刻、操作、操作者ID、対象IDを確認します。Login、Logout、Question／Answer入力、管理者による削除、BAN、BAN解除が記録対象です。Audit logの編集・削除はできません。
