# データモデル: Google OAuthとWebMCPユーザー識別の検証

本SPECでは、認証の成立性を検証するために必要な認証データだけを保存する。Question、Answer、Personal Contextは保存しない。

## エンティティ

### User

Big Question Clubで識別する利用者。

| 属性 | 説明 | 制約 |
| --- | --- | --- |
| `id` | サービス内の安定したユーザー識別子 | 一意。画面と`who_am_i` Toolで公開できる唯一の識別子 |
| `name` | OAuthプロバイダーから得られる表示名 | 本SPECのTool応答・検証記録には含めない |
| `email` | OAuthプロバイダーから得られるメールアドレス | 本SPECの画面・Tool応答・検証記録には含めない |
| `emailVerified` | メールアドレス確認状態 | 認証データとして保存する |
| `createdAt` / `updatedAt` | 作成・更新時刻 | 監査とセッション管理に使用する |

### Account

Google OAuthアカウントとUserの対応。

| 属性 | 説明 | 制約 |
| --- | --- | --- |
| `id` | Account識別子 | 一意 |
| `userId` | 対応するUser | 有効なUserを参照する |
| `providerId` | 認証プロバイダー | 本SPECではGoogleだけを許可する |
| `accountId` | プロバイダー内のアカウント識別子 | 同一プロバイダー内で同一利用者に重複して対応付けない |
| 認証トークン関連値 | OAuth処理に必要な値 | Tool応答・ログ・検証記録に含めない |

### Session

ブラウザの現在のログイン状態を示すサーバー側のセッション。

| 属性 | 説明 | 制約 |
| --- | --- | --- |
| `id` | Session識別子 | 一意。外部へ返さない |
| `userId` | 対応するUser | 有効なUserを参照する |
| `token` | Cookieと対応する不透明なセッション値 | 外部へ返さない、ログへ出力しない |
| `expiresAt` | 失効時刻 | 失効後は認証済みとして扱わない |
| `createdAt` / `updatedAt` | 作成・更新時刻 | セッション管理に使用する |

### Verification

OAuthフローの一時的な検証情報。

| 属性 | 説明 | 制約 |
| --- | --- | --- |
| `id` | Verification識別子 | 一意。外部へ返さない |
| `identifier` / `value` | OAuthフローの検証用データ | Secret相当として扱い、ログ・Tool応答・記録へ出力しない |
| `expiresAt` | 有効期限 | 期限後は無効 |

## 関係

```text
User 1 ─── * Account
User 1 ─── * Session
Verification はOAuthフロー中に独立して作成・失効する
```

## 本人確認の状態遷移

```text
未認証 ──Google OAuth成功──> 認証済み
認証済み ──ログアウト・失効──> 未認証
認証済み(アカウントA) ──ログアウト→Google OAuth成功(アカウントB)──> 認証済み(アカウントB)
```

`who_am_i`は認証済みだけでUser IDを返す。未認証、失効、破損したCookie、OAuth拒否はすべてユーザーIDを返さない。
