# `who_am_i` 本人確認契約

## 目的

ログイン済みブラウザとWebMCP Toolが同じBig Question Clubユーザーを識別できることを検証する。公開する個人情報はサービス内ユーザーIDだけとする。

## ブラウザ本人確認API

### `GET /api/who-am-i`

ブラウザCookieで現在のログイン状態を確認する。レスポンスは`Cache-Control: no-store`とする。

#### 認証済みレスポンス — `200 OK`

```json
{
  "userId": "usr_opaque_identifier"
}
```

#### 未認証レスポンス — `401 Unauthorized`

```json
{
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Sign in to identify your account."
}
```

#### サーバーエラーレスポンス — `500 Internal Server Error`

```json
{
  "code": "IDENTITY_UNAVAILABLE",
  "message": "Identity verification is temporarily unavailable."
}
```

`userId`以外のUser属性、Cookie、OAuthトークン、Secretは、どのレスポンスにも含めない。

## WebMCP Tool

### Tool definition

| 項目 | 契約 |
| --- | --- |
| 名前 | `who_am_i` |
| 入力 | 空のobject。追加プロパティを許可しない |
| 読み取り専用 | はい |
| 実行先 | 同一オリジンの相対パス`/api/who-am-i` |
| 認証情報 | ブラウザの通常の同一オリジンCookieに限る。入力やTool結果でトークンを受け渡ししない |

#### 認証済み結果

```json
{
  "userId": "usr_opaque_identifier"
}
```

#### 未認証結果

```json
{
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Sign in to identify your account."
}
```

#### 実行不能結果

```json
{
  "code": "IDENTITY_UNAVAILABLE",
  "message": "Identity verification is temporarily unavailable."
}
```

## セキュリティと検証規則

- `who_am_i`を登録・実行するページと本人確認APIは、scheme、host、portがすべて同じ正規オリジンでなければならない。
- APIは、現在のリクエストに含まれた有効なセッションだけを検証する。過去のセッションや匿名の代替識別子を返してはならない。
- WebMCP Toolの実装は、Cookie値を読み出し、ログ出力し、または別オリジンへ転送してはならない。
- すべてのエラー応答は、特定のUserが存在するか、メールアドレス、OAuthプロバイダーのアカウント情報を推測できる情報を含めてはならない。
