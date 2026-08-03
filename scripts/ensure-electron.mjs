// Electron本体のバイナリが実際に存在するかを確認し、無ければ取得し直す。
//
// npm の electron パッケージは、インストール後に別途バイナリ(約100MB)を
// ダウンロードする。社内プロキシやウイルス対策ソフトでこの通信が失敗しても
// `npm install` 自体は成功扱いで終わるため、「インストールできたのに起動しない」
// 状態になりやすい。しかも一度その状態になると npm は "up to date" と判断し、
// 再度 `npm install` してもダウンロードをやり直してくれない。
// そのためインストール後に毎回ここで実体を確認する。

import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

function resolveElectronBinary() {
  // electron パッケージは、実体のパスを path.txt に書き出している。
  const pkgDir = path.dirname(require.resolve('electron/package.json'))
  const pathTxt = path.join(pkgDir, 'path.txt')
  if (!existsSync(pathTxt)) return { pkgDir, binary: null }
  const { readFileSync } = require('node:fs')
  const rel = readFileSync(pathTxt, 'utf-8').trim()
  return { pkgDir, binary: path.join(pkgDir, 'dist', rel) }
}

let pkgDir
let binary
try {
  ;({ pkgDir, binary } = resolveElectronBinary())
} catch {
  // devDependencies を入れていない(npm install --production 等)場合はここに来る。
  // アプリの実行には必要だが、インストール自体は失敗させない。
  console.log('[ensure-electron] electron パッケージが見つかりません。開発用依存を含めて `npm install` してください。')
  process.exit(0)
}

if (binary && existsSync(binary)) {
  console.log('[ensure-electron] Electron本体を確認しました。')
  process.exit(0)
}

console.log('[ensure-electron] Electron本体が見つからないため、ダウンロードし直します…')

try {
  await import(path.join(pkgDir, 'install.js'))
} catch (err) {
  console.error('[ensure-electron] Electron本体のダウンロードに失敗しました。')
  console.error(`  理由: ${err?.message ?? err}`)
  console.error('  社内プロキシやウイルス対策ソフトが通信を遮断している可能性があります。')
  console.error('  ネットワークの通る環境で次を実行してください: node scripts/ensure-electron.mjs')
  // ここで失敗しても npm install 全体は止めない(後から取得し直せるため)。
  process.exit(0)
}
