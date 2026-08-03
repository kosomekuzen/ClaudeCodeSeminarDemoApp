# お仕事スイッチ

業務モードごとに登録したURL・ファイル・フォルダを、ボタン一つでまとめて開く常駐型デスクトップウィジェットです。**Windows 10/11 と macOS** で動きます。(旧称: 自分専用業務ランチャー)

AIによる処理はランタイムでは行いません。登録した内容をそのまま、実行前のプレビュー確認を経て、Electron標準の `shell.openExternal` / `shell.openPath` で開くだけの決定論的なツールです。

`kosomekuzen/creditmonitoring`(Claude使用量を表示する常駐ウィジェット)と同じ構成 — Electronのメインプロセスがロジックを持ち、レンダラーとはIPCでやり取りする — に揃えています。

## 構成

```
./
├─ src/
│  ├─ main/
│  │  ├─ main.js             ウィンドウ・トレイの作成、IPCハンドラの登録、設定の適用
│  │  ├─ config-service.js   業務モードのCRUDとバリデーション、data/work-modes.jsonの読み書き
│  │  ├─ launcher-service.js 実行直前の実在確認と、shell.openExternal/openPathでのオープン処理
│  │  └─ settings-service.js 設定のバリデーション、data/settings.jsonの読み書き
│  ├─ preload/
│  │  └─ preload.js          contextBridgeで安全なAPI(window.launcherAPI)だけをレンダラーに公開
│  └─ renderer/              画面(ダッシュボード・登録編集・起動確認・設定)
│     ├─ index.html
│     ├─ styles.css
│     └─ app.js
├─ build/
│  ├─ icon.png                 トレイ・ウィンドウ用アイコン(プレースホルダー。差し替え可)
│  └─ icon.ico                 デスクトップショートカット用アイコン(同上)
├─ data/
│  ├─ work-modes.json         登録内容(ローカル専用。Gitには含めない)
│  └─ settings.json           設定(ローカル専用。Gitには含めない)
└─ .claude/
   ├─ CLAUDE.md                技術方針・安全ルール・UI方針
   └─ skills/
      └─ extend-registration/  登録機能を拡張するときの開発手順(日常実行では使わない)
```

`scripts/generate-icon.mjs` が `build/icon.png` / `build/icon.ico` を生成し、`scripts/create-desktop-shortcut.vbs`(Windows)/ `scripts/create-desktop-shortcut.command`(macOS)がデスクトップショートカットを作る(下記参照)。

## 初回セットアップ

前提: Node.js 18以降。

1. ターミナルで依存パッケージをインストールする(Windows / macOS 共通)

   ```bash
   npm install
   ```

2. OSに応じて、デスクトップショートカットを作る

   | OS | 手順 |
   |---|---|
   | Windows | `scripts\create-desktop-shortcut.vbs` を**エクスプローラーでダブルクリック** |
   | macOS | `scripts/create-desktop-shortcut.command` を**Finderでダブルクリック** |

   → デスクトップに「お仕事スイッチ」のショートカットができる

3. 以降は、そのデスクトップアイコンをダブルクリックするだけで起動できる

このショートカットはElectron本体を直接起動するので、`npm start`(ターミナル経由)と違って**ターミナルを閉じてもアプリは終了しません**。ターミナルを一切使わずに起動・終了できます。

> macOSでは、初回のみ「開発元を確認できないため開けません」と表示されることがあります。その場合はショートカットを右クリック →「開く」→ ダイアログで「開く」を選ぶと、次回以降はダブルクリックで起動できます。

開発中にコードを変更してすぐ試したいときは、これまで通り以下でも起動できます(この場合はターミナルに紐づくので、ターミナルを閉じるとアプリも終了します)。

```bash
npm start
```

起動すると小さなウィンドウが表示され、常駐アイコン(Windowsはタスクトレイ、macOSはメニューバー)も出ます。

## 使い方

1. 「追加」から、業務モード名とURL・ファイル・フォルダを登録する(パスは絶対パスで直接入力する)
2. ダッシュボードのカードから「開始」を押す
3. 起動確認画面で、開く対象と状態(開けるか/開けないか)を確認する(表示名にカーソルを合わせると実際のURL/パスがツールチップで見える)
4. 「開始する」を押すと、登録済みの対象を順番に開く。対象ごとの成功・失敗が画面に表示される

ウィンドウ右上に「⚙(設定)」「_(最小化)」「✕(閉じる)」の3つのボタンがあります。「最小化」は通常の最小化(Windowsはタスクバー、macOSはDockへ)、「✕」はウィンドウを閉じて常駐アイコンに格納します(どちらもプロセスは終了しません)。

常駐アイコン(Windowsはタスクトレイ、macOSはメニューバー)を**クリックすると表示/非表示が切り替わり、右クリックで「開く」「終了」**を選べます。アプリを完全に終了するには、そのメニューの「終了」を使います。

## 設定

⚙から開く設定画面には、以下の項目があります。いずれも操作すると即座に反映され、保存ボタンはありません。

- **見た目**: テーマ(システムに合わせる/ライト/ダーク)、アクセントカラー(4色から選択)、ウィンドウの透明度
- **起動・常駐**: 常に最前面に表示、PC起動時に自動で立ち上げる、ホットキーでの呼び出し(Windows: `Ctrl + Shift + Space` / macOS: `⌘ + Shift + Space`)、ウィンドウの位置・サイズの記憶
- **実行**: 起動前の確認をスキップする(「開始」を押すと即座に実行)、実行完了時のOS通知
- **データ**: 業務モードのバックアップ(JSON形式での書き出し/読み込み。他のPCへの引き継ぎに使える)

「PC起動時に自動で立ち上げる」はElectronの`app.setLoginItemSettings`を使っており、Windowsのスタートアップフォルダやレジストリ、macOSのログイン項目を手動で操作する必要はありません。

ホットキーは、同じ組み合わせを他のアプリやOSが先に使っている場合は登録に失敗します。その場合は設定画面のホットキー欄にその旨が表示されます。

設定は `data/settings.json` にローカル保存されます(work-modes.jsonと同様、Gitには含めません)。

## 安全設計

- レンダラーはメインプロセスのAPIに直接アクセスできない(`contextIsolation: true` / `nodeIntegration: false`)。`contextBridge` で公開した `window.launcherAPI` 経由のIPCのみで通信する
- ユーザー入力をシェル(PowerShell・コマンドプロンプト・sh)に渡さない。URL/ファイル/フォルダはElectron標準の `shell.openExternal` / `shell.openPath` で開く(いずれもシェルを経由しないOS API呼び出し)
- ファイル・フォルダは「開く」以外の操作(作成・更新・移動・削除)を行わない
- 登録時・実行直前の両方でパスの実在確認を行い、存在しない対象は開かずに理由を表示する
- 一括起動の前に必ずプレビューを表示し、確認を挟む

## 既知の制約(MVPスコープ外)

- ファイル・フォルダの「選択ダイアログ」による指定には対応していません。今回はテキスト入力によるパス指定のみです(Electronの `dialog.showOpenDialog` を使えば追加は可能です)
- `build/icon.png` / `build/icon.ico` は仮のプレースホルダーです。同じファイル名で本物のロゴ画像に差し替えて `npm run generate:icon` の代わりに配置すれば反映されます
- インストーラー化(electron-builder等での.exeパッケージング)は行っていません。デスクトップショートカット経由での起動を前提にしています(それでも `npm install` は最初に一度必要です)
