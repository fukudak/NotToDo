# NotToDo - やらないことリスト

## System Intent
「やらないこと」を明確にし、理由とともに記録・管理するWebアプリ。定期的な振り返りにより、自分の行動を見直す習慣を支援する。

## Invariants
- データは `localStorage` に永続化する。外部DBもサーバーも使わない
- クライアント: React SPA (Vite)。Firebase Hosting へデプロイ
- サーバーレス構成。すべてのロジックはクライアントサイドで動作する

## Known Debt
- ユーザーデータはブラウザのlocalStorageに保存されるため、端末をまたいだ同期はない

## Failure Modes
- localStorage が無効な環境（プライベートブラウジング等）では動作しない

## 開発コマンド
```bash
bun install                  # ルートの依存
cd client && bun install     # クライアントの依存
bun run dev                  # 開発サーバー起動（client:5173）
bun run build                # クライアントビルド
bun run test                 # テスト実行
```
