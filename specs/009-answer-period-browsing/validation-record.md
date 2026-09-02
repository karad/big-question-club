# 検証記録: Challenge Core閲覧フロー

**実施日**: 2026-09-02

## 自動検証

| 検証 | 結果 | 備考 |
| --- | --- | --- |
| Unit／Integration Test | PASS | 35ファイル、605テスト成功 |
| D1 Integration Test | PASS | 16ファイル、56テスト成功 |
| Typecheck | PASS | `tsc --noEmit` |
| Lint | PASS | `eslint .` |
| Format | PASS | `prettier --check .` |
| Build | PASS | Client／Worker Build成功 |
| Schema check | PASS | BAN・Audit log追加後のDrizzle Schema検査成功 |

## 技術スタック整合性

- HomeとQuestion DetailはHono JSXコンポーネントで構築し、HTML文字列連結を使用していない。
- 新規Open Question一覧Queryは既存のDrizzle ORMを使用している。
- 既存のD1 Prepared Statementは、公開・所有権・締切を単一の条件付き書込みで保証する競合対策に限定されている。ORMによるread-then-writeへ変更しない理由をコードコメントに記録した。
- 管理画面は既存のHono JSX、認証は既存のBetter Auth、永続化は既存のDrizzle／D1を使用し、別のフレームワークを追加していない。
- BANとAudit logはDrizzle SchemaおよびD1 Migrationとして追加し、fresh／upgrade契約を既存のVitest D1構成で検証した。
- Audit logは操作種別、Actor、Target、結果、時刻だけを保持し、Question／Answer本文や認証秘密を複製しない。
- Browser側のClipboard、認証、Reveal本文取得は既存Client Entryを再利用し、別のUI Frameworkや重複Client基盤を追加していない。
- Questionの主言語入力・表示・WebMCPメタデータを削除し、任意言語の本文からPersonal Agentが回答言語を判断する契約へ変更した。既存D1列は互換性のため維持し、新規Questionには `auto` を保存する。

## 未解決事項

- なし。

## Manual Test

- SPEC 010のVisual・Reveal実装完了後に、Core Demo全体として実施する。
