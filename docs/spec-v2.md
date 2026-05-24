# NotToDo 仕様書 v2

> 最終更新: 2026-05-24
> 本仕様書はコード実装に完全に一致する版です。v1（サーバー中心）は廃止。

---

## 1. 概要

「やらないこと」を理由とともに記録し、習慣化するまで管理するWebアプリ。やめたい行動を明文化し、定期的な振り返り（守れたか／破ったか）を通じて自分の行動を見直す習慣を支援する。

### 構成

| レイヤー | 技術 | 役割 |
|----------|------|------|
| クライアント | React 19 SPA (Vite + TypeScript) | UI・状態管理・localStorage永続化 |
| ホスティング | Firebase Hosting | 静的ファイル配信（完全クライアントサイド） |

- **サーバーなし**: データはブラウザの `localStorage` にのみ保存
- **端末内完結**: 複数端末間の同期はない
- **デプロイ**: `client/dist/` を Firebase Hosting に公開

### 設計上の想定

- 単一ブラウザ・単一端末での利用前提
- 習慣化目標日数の参考値は UCL Lally研究 (2010) の「平均66日」を採用
- 複数ユーザーは端末内でのローカル切り替え

---

## 2. データモデル

すべて `localStorage` に JSON 文字列として保存される。キーは `client/src/lib/storage.ts` で定義。

### 永続化キー

| キー | 内容 |
|------|------|
| `not-to-do-items` | `NotToDoItem[]` |
| `not-to-do-reviews` | `ReviewRecord[]` |
| `not-to-do-plan` | `Record<UserId, { plan, maxItems }>` |
| `not-to-do.currentUser` | `UserId`（現在選択中のユーザーID） |

### NotToDoItem

| フィールド | 型 | 説明 |
|------|------|------|
| `id` | string (UUID) | `crypto.randomUUID()` で採番 |
| `title` | string | やらないこと |
| `reason` | string | なぜやらないか |
| `createdAt` | string (ISO 8601) | 作成日時 |
| `updatedAt` | string (ISO 8601) | 更新日時 |
| `startDate` | string (YYYY-MM-DD) | 現在の試みの開始日 |
| `targetDays` | number | 習慣化目標日数（デフォルト66） |
| `currentAttempt` | number | 現在の試み番号（1始まり） |
| `completedAt` | string \| undefined | 完了日時。未完了なら undefined |
| `userId` | string \| undefined | 所有者ユーザーID |

### ReviewRecord

| フィールド | 型 | 説明 |
|------|------|------|
| `id` | string (UUID) | レビューID |
| `itemId` | string | 対象アイテムのID |
| `adherence` | `"kept"` \| `"broke"` | 守れた／破った |
| `reflection` | string | 振り返りコメント |
| `reviewedAt` | string (ISO 8601) | 記録日時 |
| `attemptNumber` | number | 何回目の試みのレビューか（記録時のアイテムの `currentAttempt` を自動コピー） |
| `userId` | string \| undefined | 記録者のユーザーID |

### AdherenceSummary（クライアント計算、永続化されない）

| フィールド | 型 |
|------|------|
| `itemId` | string |
| `totalReviews` | number |
| `keptCount` | number |
| `brokeCount` | number |

各アイテムのレビューから `storage.computeSummary()` で集計。

### ユーザープラン

| フィールド | 型 | 説明 |
|------|------|------|
| `userId` | `"userA"` \| `"userB"` | ユーザーID |
| `plan` | `"free"` \| `"pro"` | プラン |
| `maxItems` | number | 最大アイテム数（無料: 3） |

---

## 3. アイテム状態とライフサイクル

### 状態（クライアント計算）

`ItemStatus` は3値:

| 状態 | 条件 |
|------|------|
| `ongoing` | 継続中 |
| `failed` | 現在の試みで `broke` のレビューが1件でもある |
| `achieved` | `broke` なしで `elapsedDays >= targetDays` に到達 |

判定ロジック（`ItemCard.tsx:22-42`）:

```
currentAttemptReviews = reviews.filter(
  r => (r.attemptNumber ?? 1) === currentAttempt && r.itemId === item.id
)
hasBroke = currentAttemptReviews.some(r => r.adherence === "broke")

if (hasBroke)                       → "failed"
else if (elapsed >= targetDays)     → "achieved"
else                                → "ongoing"
```

経過日数は開始日と今日の差を日単位で算出（時刻を0時0分0秒に正規化）。過去の試みのレビューは状態判定に影響しない。

### ライフサイクル

```
[作成]
   │   storage.addItem()
   ▼
[ongoing] ─── storage.addReview(adherence=kept) ───► [ongoing]（履歴に追加）
   │
   ├─ elapsed >= targetDays になる ──► [achieved]
   │
   └─ storage.addReview(adherence=broke) ──► [failed]
                                                │
                                                │  storage.updateItem(retry)
                                                ▼
                                          [ongoing]（currentAttempt+1, startDate=今日）

[ongoing/failed/achieved] ── storage.deleteItem() ──► 削除（関連レビューも削除）
```

---

## 4. 認証とユーザー

### AuthContext（`client/src/contexts/AuthContext.tsx`）

現在は**ローカルユーザー切り替えのみ**実装。外部認証はプレースホルダー。

| モード | 状態 |
|------|------|
| `local` | ローカルユーザー（userA / userB 切り替え） |
| `authenticated` | 外部認証済み（未実装） |

- `switchUser(userId)`: ユーザー切替・localStorageに保存
- `login(provider)`: アラート「近日公開です」（未実装）
- `logout()`: userA に戻す

### ユーザーID

| 値 | 用途 |
|----|------|
| `userA` | 初期ユーザー |
| `userB` | サブユーザー |

各ユーザーのアイテム・レビュー・プランは `userId` フィールドで識別。`App.tsx` でフィルタリングして表示を分ける。

---

## 5. UIコンポーネント

### App.tsx（ルート）

- **ヘッダー**: タイトル「やらないことリスト」、サブタイトル、現在ユーザー表示、ユーザー切替ボタン
- **タブナビゲーション**: 4タブ（`list` / `review` / `edit` / `settings`）
- **タブ**:
  - `list` — アイテム一覧 + 追加フォーム + バックアップ操作
  - `review` — 振り返り入力 + 最近のレビュー履歴
  - `edit` — アイテム一覧から直接編集（タイトル・理由・完了状態）
  - `settings` — アカウント情報 + プラン表示 + アップグレード導線
- 各タブに `aria-labelledby`・`role="tab"` 等のアクセシビリティ属性を付与

### AddItemForm（`components/AddItemForm.tsx`）

アイテム追加フォーム。入力項目:

- やらないこと（title、必須）
- なぜやらないか（reason、textarea、必須）
- 開始日（date、デフォルト今日）
- 習慣化目標期間: 21日 / 66日（推奨・Lally研究） / 90日 / カスタム（1〜365日）
- title・reason が空白時は送信不可
- 送信中は「追加中...」に変わり disabled

### ItemList（`components/ItemList.tsx`）

アイテム一覧。`items.length === 0` のとき空状態を表示。各アイテムを `ItemCard` でレンダリング。

### ItemCard（`components/ItemCard.tsx`）

1アイテムのカード。状態はクライアント計算。

- **ヘッダー**: 試み番号バッジ（2回目以降のみ「N回目の挑戦」）、タイトル、削除ボタン
- **理由**
- **達成バッジ**（achieved時）: ★習慣化達成！ N日間継続
- **失敗メッセージ**（failed時）: 「破いてしまいましたが、諦めないで。」＋「リトライする」ボタン
- **進捗バー**（achieved以外）: 経過日数 / 目標日数、進捗率%、ステージクラス
  - `progress-stage-1`: 0〜33%
  - `progress-stage-2`: 34〜66%
  - `progress-stage-3`: 67〜100%
- **フッター**: 振り返り回数、最終振り返り日、開始日

### ItemEditList（`components/ItemEditList.tsx`）

編集タブ。アイテム一覧をインラインで編集可能。

- タイトル・理由の編集
- 完了にする / 完了を取り消す
- 削除

### ReviewPanel（`components/ReviewPanel.tsx`）

振り返りタブ。

- 対象アイテム選択（select ドロップダウン）
- 「守れましたか？」kept / broke ラジオ
- 振り返りコメント（textarea）
- 「最近の振り返り」: 全レビューを `reviewedAt` 降順で最新10件表示
- アイテムがない場合は「振り返り対象のアイテムがありません。」を表示

### DataManager（`components/DataManager.tsx`）

リストタブ下部のバックアップ操作。

- **バックアップを保存**: Markdownを生成してブラウザでダウンロード（アイテム0件時 disabled）
- **エクスポート（JSON）**: `storage.exportAll()` で JSON を直接ダウンロード
- **バックアップを読み込む**: Markdown/JSONファイル選択 → `parseBackupFile()` でパース → `storage.importAll()` でインポート
- **インポート（JSON）**: JSONファイル選択 → プレビュー表示 → 確認後インポート実行（インポート時に現在の `userId` を各アイテム・レビューに付与）
- 成功・失敗メッセージを3秒間（成功時のみ自動消去）表示

### UpgradePrompt（`components/UpgradePrompt.tsx`）

設定タブ内の課金案内。

- 無料版: 「3件まで」「エクスポート可」
- 有料版: 「無制限」「クラウド同期（将来）」「優先サポート」
- アップグレード / 復元購入ボタン（共にプレースホルダー）

---

## 6. ストレージ層（`client/src/lib/storage.ts`）

すべて localStorage への直接読み書き。非同期ではない（同期的）。

### 公開関数

| 関数 | 説明 |
|------|------|
| `getItems()` | アイテム一覧取得 |
| `addItem(title, reason, startDate, targetDays, userId?)` | アイテム追加・UUID採番 |
| `updateItem(id, data)` | アイテム更新（title/reason/completedAt/currentAttempt/startDate） |
| `deleteItem(id)` | アイテム削除（関連レビューも削除） |
| `getReviews()` | レビュー一覧取得 |
| `addReview(itemId, adherence, reflection, userId?)` | レビュー追加・attemptNumberを自動コピー |
| `computeSummary(reviews)` | アイテムごとの遵守率サマリーを計算 |
| `getPlan(userId)` | プラン取得（未設定時 free / 3件） |
| `setPlan(userId, plan, maxItems)` | プラン設定 |
| `exportAll()` | 全データをJSON文字列でエクスポート |
| `importAll(jsonString)` | JSON文字列から一括インポート（ID重複は上書き） |

### エクスポート / インポート詳細

#### クライアントエクスポート（`exportMarkdown.ts`）

- `generateMarkdown(items, reviews)`: アイテムとレビューからMarkdown文字列を生成
  - 人間可読部分: タイトル・理由・開始日・目標・進捗・状態・振り返り履歴（現在の試みのレビューのみ）
  - コメント内の `|` は全角 `｜` にエスケープ
  - `<!--BACKUP_DATA\n{ JSON }\n-->` コメントで機械可読データを埋め込み
- `downloadMarkdown(content, filename)`: Blob を作成して `<a>` クリックでダウンロード

#### クライアントインポート（`importMarkdown.ts`）

- `parseBackupFile(text, filename)`: 拡張子で自動判別
  - `.md`: `<!--BACKUP_DATA ... -->` のJSONを正規表現で抽出
  - `.json`: 全体をJSONとしてパース、`items` と `reviews` の存在を検証
  - 不明: Markdown → JSON の順でフォールバック
- `mergeBackupData(existingItems, existingReviews, imported)`: IDをキーにMapで重ね合わせ（上書き+追加）

#### DataManagerのインポートフロー

1. ユーザーがファイルを選択
2. `parseBackupFile()` でパース（Markdown/JSON自動判別）
3. JSONインポート時は現在の `userId` を各アイテム・レビューに付与して `storage.importAll()` を呼ぶ
4. `onImportComplete()` で `useItems` と `useReviews` の `refresh` を並行実行

---

## 7. カスタムフック

### useItems（`hooks/useItems.ts`）

| 機能 | 説明 |
|------|------|
| `items` | localStorage から同期的に初期化したアイテム一覧 |
| `addItem(...)` | storage.addItem() を呼びstate更新 |
| `removeItem(id)` | storage.deleteItem() を呼びstate更新 |
| `retryItem(id)` | currentAttempt+1、startDate=今日 にリセット |
| `editItem(id, data)` | title/reason/completedAt を更新 |
| `refresh()` | localStorageを再読み込み |

### useReviews（`hooks/useReviews.ts`）

| 機能 | 説明 |
|------|------|
| `reviews` | localStorage から同期的に初期化 |
| `summary` | `computeSummary()` で集計した遵守率サマリー |
| `addReview(...)` | storage.addReview() を呼びstate更新 |
| `refresh()` | localStorageを再読み込み |

### usePlan（`hooks/usePlan.ts`）

| 機能 | 説明 |
|------|------|
| `plan` | localStorage から同期的に初期化（デフォルト free / 3件） |
| `userId` が変わったら再取得 | useEffect で監視 |

---

## 8. プランと件数制限

### 無料版（free）

- 最大アイテム数: 3件
- 上限到達時: 追加フォームが案内表示に置き換わり「アップグレード」ボタンを表示
- エクスポート（Markdown/JSON）: 無料版でも可
- インポート（JSON）: 無料版でも可

### 有料版（pro）

- アイテム数無制限
- クラウド同期（将来機能）
- 優先サポート

### プラン切替

- 現状 `setPlan()` を直接呼ぶ導線なし。UpgradePrompt 内のボタンはプレースホルダー（`alert("近日公開です")`）

---

## 9. 開発コマンド

```bash
bun install                  # ルートの依存
cd client && bun install     # クライアントの依存
bun run dev                  # 開発サーバー起動（client:5173）
bun run build                # クライアントビルド
bun run test                 # テスト実行
```

### ビルド成果物

- `client/dist/` — Firebase Hosting にデプロイする静的ファイル群

---

## 10. 既知の制約

### Known Debt

- localStorage は同一ブラウザ内にのみ保存されるため、端末をまたいだ同期はない
- プライベートブラウジング等で localStorage が無効な環境では動作しない

### 未実装（プレースホルダー）

- 外部認証（Google 等）
- 課金 / 有料版へのアップグレード
- Stripe 決済連携
- サーバーサイド同期・バックアップ
- プッシュ通知・リマインダー

---

## 11. ディレクトリ構成

```
NotToDo/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddItemForm.tsx        # 追加フォーム
│   │   │   ├── DataManager.tsx        # バックアップ操作
│   │   │   ├── ItemCard.tsx           # アイテムカード（状態計算含む）
│   │   │   ├── ItemEditList.tsx       # 編集タブ
│   │   │   ├── ItemList.tsx           # 一覧
│   │   │   ├── ReviewPanel.tsx        # 振り返り
│   │   │   └── UpgradePrompt.tsx      # 課金案内
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # 認証・ユーザー切替
│   │   ├── hooks/
│   │   │   ├── useItems.ts            # アイテム操作フック
│   │   │   ├── usePlan.ts             # プランフック
│   │   │   └── useReviews.ts          # レビューフック
│   │   ├── lib/
│   │   │   ├── storage.ts             # localStorage 操作
│   │   │   ├── exportMarkdown.ts      # Markdown生成・DL
│   │   │   └── importMarkdown.ts      # Markdown/JSONパース
│   │   ├── types/
│   │   │   └── index.ts               # 型定義
│   │   ├── App.tsx                    # ルート
│   │   └── main.tsx                   # エントリ
│   ├── _tests/                        # クライアントテスト
│   ├── dist/                          # ビルド成果物
│   └── package.json
├── docs/
│   ├── spec-v2.md                     # 本ファイル
│   ├── plans/                         # 実装計画・日誌
│   └── adr/ADR-001-tech-stack.md
├── Makefile
├── package.json
└── vitest.config.ts                    # server/client 両プロジェクト
```

---

## 変更履歴

| 版 | 日付 | 内容 |
|---|---|---|
| v1 | 2026-05-20 | 初版。Bun/Honoサーバー + JSONファイル永続化を想定 |
| v2 | 2026-05-24 | 全面更新。React SPA + localStorage 構成に合わせて全面書き換え |
| v2.1 | 2026-05-24 | UpgradePrompt 文言修正（エクスポート不可→可）、無料/有料特記述整合化、矛盾セクション削除 |
