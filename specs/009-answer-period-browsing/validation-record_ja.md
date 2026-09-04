# 検証記録: Challenge Core閲覧フロー

**実施日**: 2026-09-02

## 自動検証

| 検証 | 結果 | 備考 |
| --- | --- | --- |
| Unit／Integration Test | PASS | 35ファイル、610テスト成功 |
| D1 Integration Test | PASS | 16ファイル、56テスト成功 |
| Typecheck | PASS | `tsc --noEmit` |
| Lint | PASS | `eslint .` |
| Format | PASS | `prettier --check .` |
| Build | PASS | Client／Worker Build成功 |
| Schema check | PASS | BAN・Audit log追加後のDrizzle Schema検査成功 |

## 技術スタック整合性

- HomeとQuestion DetailはHono JSXコンポーネントで構築し、HTML文字列連結を使用していない。
- 共通HeaderはLogo SVGをVite AssetとしてImportし、Home、Question Detail、Question管理、認可済み管理画面で同じコンポーネントを使用する。Production Buildでハッシュ付きSVGの配信物生成を確認した。
- 新規Open Question一覧Queryは既存のDrizzle ORMを使用している。
- 既存のD1 Prepared Statementは、公開・所有権・締切を単一の条件付き書込みで保証する競合対策に限定されている。ORMによるread-then-writeへ変更しない理由をコードコメントに記録した。
- 管理画面は既存のHono JSX、認証は既存のBetter Auth、永続化は既存のDrizzle／D1を使用し、別のフレームワークを追加していない。
- 管理画面は `/club-operations` だけで提供し、一般画面からLinkしない。旧 `/admin`、未ログイン、一般User、設定不備は通常の404と同じ応答とし、認可済み画面へ `noindex, nofollow` を設定した。
- BANとAudit logはDrizzle SchemaおよびD1 Migrationとして追加し、fresh／upgrade契約を既存のVitest D1構成で検証した。
- Audit logは操作種別、Actor、Target、結果、時刻だけを保持し、Question／Answer本文や認証秘密を複製しない。
- Browser側のClipboard、認証、Reveal本文取得は既存Client Entryを再利用し、別のUI Frameworkや重複Client基盤を追加していない。
- Questionの主言語入力・表示・WebMCPメタデータを削除し、任意言語の本文からPersonal Agentが回答言語を判断する契約へ変更した。既存D1列は互換性のため維持し、新規Questionには `auto` を保存する。
- Agent依頼Promptは閲覧中リクエストのOriginを使ったQuestion絶対URLを含め、ローカル／本番環境へ追従する。QueryとFragmentを除外し、HTML escapingとともにUnit／Integration Testで確認した。
- Agent依頼Promptを `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}` の確定文面へ更新した。ChatGPTの組み込みブラウザを使い既存Chrome Tabを使わない指定をPromptへ含める。詳細なContext根拠規則は `get_question` の固定instructionとTool descriptionへ分離し、現在の会話・利用可能な過去会話・Project ContextにあるUser自身の記述を優先する。Assistant提案や比較候補を事実とみなさず、明示的な個人見解がない場合は未確認の個人事実や既知の信条として断定しない最善の代理回答を作成・投稿し、その不足だけを理由に確認質問をしない。初回Promptは投稿許可を含むため追加Preview／承認を要求せず、投稿後は `get_my_submission` で確認する契約をUnit／Integration Testで固定した。

## 未解決事項

- なし。

## Manual Test

- 確定Promptと拡張済みContext instructionを実Personal Agentが解釈する確認は、SPEC 010のVisual・Reveal実装完了後にCore Demo全体として実施する。

## 2026-09-03 管理一覧の追加検証

- 管理画面トップが4つの専用一覧へのLinkだけを持ち、個別Recordを含まないことを実ブラウザーで確認した。
- User、Question、Answer、Audit logがすべてTable形式であることを実ブラウザーで確認した。
- Audit log 22件を20件と2件へ分割し、`Next`／`Previous`とページ番号で移動できることを確認した。
- Unit／Integration 44ファイル647テスト、D1 Integration 16ファイル60テスト、Typecheck、Lint、Format、Build、Schema checkに成功した。
