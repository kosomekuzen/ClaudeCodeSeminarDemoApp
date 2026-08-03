---
name: extend-registration
description: 業務モードの登録機能(URL・ファイル・フォルダの種類追加や項目変更)を安全に拡張するときの確認・実装・テスト手順。日常実行(業務モードを開く)の機能ではなく、開発時にのみ使う。
---

# 登録機能を拡張する手順

このSkillは、「お仕事スイッチ」に新しい登録対象の種類を増やす・登録項目を変更する、といった開発作業を行うときに使う。

## 1. 確認

着手前に、変更内容が `.claude/CLAUDE.md` の安全ルールに反していないか確認する。特に:
- 追加する種類は「開く」だけで完結するか(作成・更新・移動・削除・任意コマンド実行を伴わないか)
- `shell.openExternal` / `shell.openPath` 以外の方法(`child_process` でのシェル起動など)で開こうとしていないか
- レンダラーからメインプロセスの機能に直接アクセスしようとしていないか(必ず `contextBridge` 経由のIPCにする)
- 実在確認・プレビュー・日本語エラーメッセージが既存の種類と同様に用意できるか

反する場合は、実装せずにその旨を報告して確認を取る。

## 2. 実装

以下の順で、既存の3種類(urls / files / folders)と同じパターンに揃えて実装する。

1. `src/main/config-service.js`
   - `TARGET_KEYS` / `TARGET_LABELS` に追加する
   - `validateEntry()` に、その種類固有の検証(形式チェック・実在確認など)を追加する
2. `src/main/launcher-service.js`
   - `TYPE_OF_KEY` に追加する
   - `checkTarget()` に実行直前チェックを追加する(config-serviceの検証と同等のロジック)
   - `openWithOS()` にその種類の開き方を追加する(`shell.openExternal` か `shell.openPath` のいずれか)
3. `src/renderer/app.js`
   - `TARGET_TYPES` にUI用の定義(コンテナID・placeholder)を追加する
   - `TYPE_LABEL_JA` に表示名を追加する
4. `src/renderer/index.html`
   - 対応する `.target-group` ブロックを追加する

メインプロセスとレンダラーの間で新しいやり取りが必要な場合は、`src/main/main.js` の `ipcMain.handle(...)` と `src/preload/preload.js` の `contextBridge.exposeInMainWorld(...)` を対で追加する。

## 3. テスト

実装後、必ず以下を確認する。

- [ ] 正常な値で登録でき、`data/work-modes.json` に保存される
- [ ] アプリを再起動しても登録内容が残る
- [ ] 不正な値(形式違反・存在しないパスなど)は保存されず、日本語のエラーメッセージが表示される
- [ ] 起動確認(プレビュー)画面に、新しい種類の対象が正しく表示される
- [ ] 一部の対象が開けない状態でも、他の対象の起動は継続する
- [ ] 追加した種類が `shell.openExternal` / `shell.openPath` で開かれている(シェル文字列を組み立てていない)
