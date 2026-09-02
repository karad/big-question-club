# 契約: 管理画面と公開運用

## 設定と認可

- `ADMIN_EMAIL`に単一の管理者Emailを設定する。前後空白を除去し、小文字化した有効なEmailだけを受理する。
- 管理者判定はSession由来User IDでDB Userを取得し、正規化済みEmailが設定値と完全一致する場合だけ成功する。
- 未ログインは401、一般Userは403、設定・Repository障害は503とする。
- すべての管理Responseは `Cache-Control: private, no-store` と `Vary: Cookie` を返す。

## Route

| Method | Path | 目的 | 成功 |
| --- | --- | --- | --- |
| `GET` | `/admin` | User、Question、Answer、Audit log一覧 | 200 HTML |
| `POST` | `/admin/questions/{id}/delete` | Questionと配下Answerの削除 | 303 `/admin` |
| `POST` | `/admin/answers/{id}/delete` | Answer 1件の削除 | 303 `/admin` |
| `POST` | `/admin/users/{id}/ban` | User BANと全Session失効 | 303 `/admin` |
| `POST` | `/admin/users/{id}/unban` | User BAN解除 | 303 `/admin` |

- POSTは同一OriginのCSRF検証と明示確認値 `confirm=on` を必須とする。
- missing対象は404、管理者自身のBANは409、確認不足は400とする。
- 削除・BAN・解除の成功と専用Audit logは同一D1 Batchで確定する。

## 一覧表示

- User: ID、Name、Email、BAN状態、作成時刻、BAN／解除操作。
- Question: ID、本文、Creator User ID、状態、作成・更新時刻、削除操作。
- Answer: ID、Question ID、User ID、Excerpt、本文、作成・更新時刻、削除操作。
- Audit log: Actor User ID、Action、Target type／ID、Outcome、発生時刻。
- Question／Answer本文はHono JSXのtext nodeとして扱い、HTMLやScriptとして解釈しない。

## BAN

- BAN時は対象Userを `banned_users` へ登録し、同じUserの全Sessionを削除する。
- Better AuthのSession作成前Hookは `banned_users` を確認し、BAN中のUserにはSessionを作らない。
- BAN解除後も過去Sessionは復元せず、Userは新しくLoginする。
- 管理者自身はBANできない。

## Audit log

- DB TriggerはSession、Question、Answerの成功した作成・更新を記録する。本人によるAnswer削除は、所有権と回答期限の条件付き削除と同じD1 Batchで記録する。
- 管理者操作は専用Actionで記録し、操作した管理者をActorとする。
- Audit logにはコンテンツ本文、Excerpt、Email、Cookie、Token、OAuth値を保存しない。
- Audit logの更新・削除Routeを提供しない。
