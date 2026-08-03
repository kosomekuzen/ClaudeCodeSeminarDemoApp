#!/bin/bash
# デスクトップに「お仕事スイッチ」の起動用ショートカットを作成する(初回セットアップ用、macOS専用)。
# ターミナル経由(npm start)ではなくElectron本体を直接起動する形にするため、
# 起動後にターミナルを閉じてもアプリは終了しない。
#
# 使い方: npm install の後、このファイルをFinderでダブルクリックする。

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELECTRON="$PROJECT_DIR/node_modules/.bin/electron"
SHORTCUT="$HOME/Desktop/お仕事スイッチ.command"

if [ ! -x "$ELECTRON" ]; then
  osascript -e 'display alert "セットアップエラー" message "Electronが見つかりません。先にプロジェクトフォルダで npm install を実行してください。" as critical' >/dev/null 2>&1 || true
  echo "Electronが見つかりません: $ELECTRON" >&2
  echo "先に npm install を実行してください。" >&2
  exit 1
fi

# 起動用スクリプトを書き出す。パスは単一引用符で囲み、内部の ' は '\'' でエスケープする。
escaped_project_dir=${PROJECT_DIR//\'/\'\\\'\'}
cat > "$SHORTCUT" <<EOF
#!/bin/bash
# 「お仕事スイッチ」起動用(scripts/create-desktop-shortcut.command が生成)
cd '$escaped_project_dir' || exit 1
# nohupでターミナルから切り離し、ターミナルを閉じてもアプリが終了しないようにする。
nohup ./node_modules/.bin/electron . >/dev/null 2>&1 &
EOF

chmod +x "$SHORTCUT"

osascript -e 'display alert "完了" message "デスクトップに「お仕事スイッチ」を作成しました。次回からはこのアイコンをダブルクリックするだけで起動できます。"' >/dev/null 2>&1 || true
echo "デスクトップに作成しました: $SHORTCUT"
