# 東京物件サーチ

東京エリアの賃貸物件を、こだわり条件でかんたんに検索できる Web アプリです。[Next.js](https://nextjs.org)（App Router）+ TypeScript + Tailwind CSS で構築しています。

## 主な機能

- **こだわり条件検索**
  - 駅からの徒歩時間
  - スーパーの近さ
  - 病院からの離れ具合
  - 条件は `app/lib/filters.ts` の `FILTER_DEFINITIONS` に定義を追加するだけで拡張できます（UI・絞り込みロジックとも自動で反映されます）。
- **物件一覧**
  - 物件画像（必須）、間取り、広さ、最寄り駅を表示
  - 賃料順・駅からの近さ順などで並び替え可能
- **物件詳細ページ**
  - ギャラリー画像、賃料・管理費、間取り／広さ／築年数／所在階、最寄り駅・スーパー・病院までの距離

物件データは `app/lib/properties.ts` のモックデータです。

## 開発の始め方

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くとアプリが確認できます。

## 物件画像について

物件画像は外部サービスに依存しないよう、`scripts/generate-placeholder-images.mjs` で生成したプレースホルダー SVG（`public/images/properties/`）を使用しています。物件データを追加した場合は、以下のコマンドで画像を再生成できます。

```bash
npm run generate:images
```

## その他のコマンド

```bash
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
npm run lint    # ESLint
```
