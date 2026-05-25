# Cloudflare Pages デプロイ手順

NotToDo は静的 React SPA（localStorage のみ）のため、**Cloudflare Pages** が適している。

## ビルド設定（Pages ダッシュボード）

| 項目 | 値 |
|------|-----|
| Framework preset | None（または Vite） |
| Build command | `npm run build` |
| Build output directory | `client/dist` |
| Root directory | **空欄**（`/` は入れない） |

Pages には Deploy command の項目がない。ビルド成功後、出力ディレクトリが自動公開される。

## 新規 Pages プロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
2. **Pages** タブ → **Connect to Git**
3. リポジトリ `fukudak/NotToDo` を選択
4. 上記ビルド設定を入力
5. **Save and Deploy**

初回デプロイ後、`https://<project-name>.pages.dev` で公開される。

## 既存 Worker プロジェクトからの移行

Worker（`nottodo`）で Workers Builds を使っていた場合:

1. 上記のとおり **Pages プロジェクトを新規作成**（同じ Git リポジトリでよい）
2. Pages のデプロイが成功することを確認
3. カスタムドメインが Worker に向いていれば、Pages 側に付け替える
4. 不要になった Worker プロジェクト `nottodo` は削除してよい

## SPA ルーティング

`client/public/_redirects` に以下を置いている。ビルド時に `client/dist/` へコピーされる。

```
/*    /index.html   200
```

## ローカル確認

```bash
npm install
npm run build
# client/dist/ に成果物が生成される
```

## トラブルシュート

| 症状 | 対処 |
|------|------|
| `root directory not found` | Root directory を空欄にする（`/` や `client/dist` は不可） |
| `bun install --frozen-lockfile` 失敗 | ルートに `bun.lock` を置かない（`package-lock.json` を使用） |
| 404 on refresh | `_redirects` が `client/dist/` に含まれているか確認 |
