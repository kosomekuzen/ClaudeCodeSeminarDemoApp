# 自分専用業務ランチャー(Electronウィジェット版)

業務モードごとに登録したURL・ファイル・フォルダを、ボタン一つでまとめて開く、タスクトレイ常駐型のWindows向けデスクトップウィジェットです。

AIによる処理はランタイムでは行いません。登録した内容をそのまま、実行前のプレビュー確認を経て、Electron標準の `shell.openExternal` / `shell.openPath` で開くだけの決定論的なツールです。

`kosomekuzen/creditmonitoring`(Claude使用量を表示する常駐ウィジェット)と同じ構成 — Electronのメインプロセスがロジックを持ち、レンダラーとはIPCでやり取りする — に揃えています。

## 構成

```
my-work-launcher/
├─ src/
│  ├─ main/
│  │  ├─ main.js             ウィンドウ・トレイの作成、IPCハンドラの登録
│  │  ├─ config-service.js   業務モードのCRUDとバリデーション、data/work-modes.jsonの読み書き
│  │  └─ launcher-service.js 実行直前の実在確認と、shell.openExternal/openPathでのオープン処理
│  ├─ preload/
│  │  └─ preload.js          contextBridgeで安全なAPI(window.launcherAPI)だけをレンダラーに公開
│  └─ renderer/              画面(ダッシュボード・登録編集・起動確認)
│     ├─ index.html
│     ├─ styles.css
│     └─ app.js
├─ build/
│  └─ icon.png                トレイ・ウィンドウ用アイコン(プレースホルダー。差し替え可)
├─ data/
│  └─ work-modes.json         登録内容(ローカル専用。Gitには含めない)
└─ .claude/
   ├─ CLAUDE.md                技術方針・安全ルール・UI方針
   └─ skills/
      └─ extend-registration/  登録機能を拡張するときの開発手順(日常実行では使わない)
```

## 動かし方

前提: Node.js 18以降。対象アプリ自体はWindows 10/11向けです。

```bash
cd my-work-launcher
npm install
npm start
```

起動すると、画面右下あたりに小さなウィンドウが表示され、タスクトレイにもアイコンが常駐します。

## 使い方

1. 「追加」から、業務モード名とURL・ファイル・フォルダを登録する(パスは絶対パスで直接入力する)
2. ダッシュボードのカードから「開始」を押す
3. 起動確認画面で、開く対象と状態(開けるか/開けないか)を確認する(表示名にカーソルを合わせると実際のURL/パスがツールチップで見える)
4. 「開始する」を押すと、登録済みの対象を順番に開く。対象ごとの成功・失敗が画面に表示される

ウィンドウ右上の「─」でトレイに格納。トレイアイコンをクリックすると再表示、右クリックで「開く」「終了」を選べます。閉じるボタンではプロセスは終了しません(常駐)。

## スタートアップ登録(任意)

`creditmonitoring` と同様に、Windowsのスタートアップフォルダにショートカットを置くと、PC起動時に自動で立ち上がります。

1. `Win + R` → `shell:startup` でスタートアップフォルダを開く
2. `node_modules\electron\dist\electron.exe` へのショートカットを作成し、リンク先の引数にこのプロジェクトのフォルダパスを追加する(例: `electron.exe "C:\path\to\my-work-launcher"`)

## 安全設計

- レンダラーはメインプロセスのAPIに直接アクセスできない(`contextIsolation: true` / `nodeIntegration: false`)。`contextBridge` で公開した `window.launcherAPI` 経由のIPCのみで通信する
- ユーザー入力をシェル(PowerShell・コマンドプロンプト)に渡さない。URL/ファイル/フォルダはElectron標準の `shell.openExternal` / `shell.openPath` で開く(いずれもシェルを経由しないOS API呼び出し)
- ファイル・フォルダは「開く」以外の操作(作成・更新・移動・削除)を行わない
- 登録時・実行直前の両方でパスの実在確認を行い、存在しない対象は開かずに理由を表示する
- 一括起動の前に必ずプレビューを表示し、確認を挟む

## 既知の制約(MVPスコープ外)

- ファイル・フォルダの「選択ダイアログ」による指定には対応していません。今回はテキスト入力によるパス指定のみです(Electronの `dialog.showOpenDialog` を使えば追加は可能です)
- `build/icon.png` は仮のプレースホルダーです。同じファイル名で本物のロゴ画像に差し替えれば反映されます
- インストーラー化(electron-builder等でのパッケージング)は行っていません。`npm start` での起動を前提にしています
