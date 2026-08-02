# AI業務ランチャー(プロトタイプ)

日常業務をボタン化し、Claude CodeとSkillsで処理する「自分専用AI業務ランチャー」の講座デモ用プロトタイプです。

依存パッケージなし(Node.js標準ライブラリのみ)で動きます。

## 構成

```
ai-work-launcher/
├─ public/            画面(業務カード・入力欄・結果表示・実行履歴)
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
├─ server/
│  └─ server.js        ブラウザからの実行リクエストを受けてClaude Codeをヘッドレス実行する
└─ .claude/
   ├─ CLAUDE.md         全Skill共通のルール
   └─ skills/
      ├─ minutes/       会議メモ整理
      └─ reply/         メール返信作成
```

処理の流れ:

```
ブラウザ(業務を選ぶ→入力する→実行する)
  ↓ POST /api/run { skill, input }
ローカルサーバー(server/server.js)
  ↓ claude -p "/<skill>\n\n<input>"
Claude Code CLI(ヘッドレス実行)
  ↓ テキストのみ返す(ファイル操作はしない)
ブラウザ(結果表示・コピー・Markdown保存・履歴に蓄積)
```

## 動かし方

前提: Node.js 18以降、`claude` コマンドがインストール・ログイン済みであること。

```bash
cd ai-work-launcher
npm start
```

[http://localhost:3939](http://localhost:3939) を開く。

## 業務を1つ追加する手順(講座のライブデモ部分)

1. `.claude/skills/<新しい業務>/SKILL.md` を追加する(入出力フォーマットとルールを書くだけ)
2. `server/server.js` の `SKILLS` に業務名を追加する
3. `public/app.js` の `TASKS` にカード情報(id・ラベル・説明・placeholder)を追加する

これだけで画面にカードが増え、実行できるようになります。

## 設計上の注意

- Skillは「テキストを受け取ってテキストを返す」ことに限定しています。ファイル操作をSkillにさせると権限確認が走り、ヘッドレス実行(`-p`)では応答できず止まるためです。保存したい場合は、返ってきたテキストをブラウザ側で `.md` としてダウンロードします。
- 実行には10〜30秒ほどかかるため、画面には「処理中…」表示があります。
- 実行履歴はブラウザの `localStorage` に保存されます(サーバー側では何も保持しません)。
