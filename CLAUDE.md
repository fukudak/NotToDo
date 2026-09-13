# NotToDo - やらないことリスト

## System Intent
「やらないこと」を明確にし、理由とともに記録・管理するWebアプリ。定期的な振り返りにより、自分の行動を見直す習慣を支援する。

## Invariants
- データは `localStorage` に永続化する。外部DBもサーバーも使わない
- クライアント: React SPA (Vite)。Cloudflare Pages へデプロイ
- サーバーレス構成。すべてのロジックはクライアントサイドで動作する

## Known Debt
- ユーザーデータはブラウザのlocalStorageに保存されるため、端末をまたいだ同期はない

## Failure Modes
- localStorage が無効な環境（プライベートブラウジング等）では動作しない

## 開発コマンド
```bash
npm ci                       # 依存を固定lockから導入
npm run dev                  # 開発サーバー起動（client:5173）
npm run build                # クライアントビルド
npm test                     # テスト実行
```
