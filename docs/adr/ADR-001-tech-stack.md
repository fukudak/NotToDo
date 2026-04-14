# ADR-001: 技術スタック選定（Hono + React + Bun）

## Status
Accepted

## Context
やらないことリストの個人向けWebアプリを新規構築する。シンプルなCRUD + 振り返り機能が必要で、外部サービスへの依存を避けたい。

## Decision
- **ランタイム**: Bun — 高速なTypeScript実行、組み込みのファイルI/O
- **バックエンド**: Hono — 軽量で型安全なWebフレームワーク
- **フロントエンド**: React + Vite — 標準的なSPA構成
- **データ保存**: JSONファイル — サーバー不要、バックアップが容易

## Rationale
- 個人向けツールのため、インフラの複雑さを最小限にしたい
- Bunの組み込みファイルAPIでDB不要の永続化が可能
- Honoは軽量でBunとの相性が良く、API定義が簡潔
- Viteは高速なHMRで開発体験が良い

## Rejected Alternatives
- **Next.js**: フルスタック機能は過剰。SSRは不要
- **Astro**: コンテンツファーストで、インタラクティブなCRUDには向かない
- **SQLite**: 将来的には有効だが、現時点ではJSONファイルで十分

## Revisit Conditions
- 複数ユーザー対応が必要になった場合（認証・DB導入）
- データ量が大きくなりJSONファイルの読み書きが遅くなった場合
