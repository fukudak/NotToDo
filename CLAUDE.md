# NotToDo - やらないことリスト

## System Intent
「やらないこと」を明確にし、理由とともに記録・管理するWebアプリ。定期的な振り返りにより、自分の行動を見直す習慣を支援する。

## Invariants
- データはJSONファイル（`data/not-to-do-items.json`）に永続化する。外部DBは使わない
- サーバー: Hono (Bun)、クライアント: React SPA (Vite)
- APIは `/api/*` パス以下に配置。それ以外はSPAにフォールバック
- `data/` ディレクトリは `.gitignore` に含まれる（ユーザーデータはリポジトリに含めない）

## Known Debt
- サーバーとクライアントで型定義が重複している（`server/domain/types.ts` と `client/src/types/index.ts`）。共有パッケージの導入は過剰と判断して許容
- JSONファイルへの同時書き込み制御なし。単一ユーザー利用の前提

## Failure Modes
- `data/` ディレクトリが存在しない場合、初回書き込み時に作成される。権限エラーが出た場合は手動で `mkdir data` が必要
- `bun run start` 時に `client/dist/` がないと404になる。`bun run build` を先に実行すること

## 開発コマンド
```bash
bun install                  # ルートの依存
cd client && bun install     # クライアントの依存
bun run dev                  # 開発サーバー起動（server:3000 + client:5173）
bun run build                # クライアントビルド
bun run start                # 本番モード起動
```
