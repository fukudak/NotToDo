# NotToDo 仕様書 v1

> ⚠️ **この仕様書は廃止されました。** 最新の仕様は [`spec-v2.md`](spec-v2.md) を参照してください。
>


## 1. 概要

「やらないこと」を理由とともに記録し、習慣化するまで管理するWebアプリ。やめたい行動を明文化し、定期的な振り返り（守れたか／破ったか）を通じて自分の行動を見直す習慣を支援する。

### 構成
- サーバー: Hono (Bun) — `server/index.ts` から起動
- クライアント: React SPA (Vite) — `client/src/App.tsx` がルート
- 永続化: `data/not-to-do-items.json`（外部DBなし、認証なし）
- APIは `/api/*` 配下。それ以外は `client/dist/` の静的ファイル配信、未知のパスは `index.html` にフォールバック (`server/index.ts:21-32`)
- 開発時のCORSは `http://localhost:5173` を許可 (`server/index.ts:12`)
- サーバーポートは環境変数 `PORT`、未指定時は `3000`

### 設計上の想定
- 単一ユーザー利用前提（同時書き込み制御なし）
- 「習慣化目標日数」の参考値は UCL Lally研究 (2010) の「平均66日」を採用（`client/src/components/AddItemForm.tsx`）

---

## 2. データモデル

データファイル `data/not-to-do-items.json` のルート構造は `NotToDoData`（`server/domain/types.ts`）。

### ルート構造

```json
{
  "items": [ /* NotToDoItem[] */ ],
  "reviews": [ /* ReviewRecord[] */ ]
}
```

書き込みは一時ファイル `.not-to-do-items.tmp.json` を作成してから `rename` するアトミック更新で行う (`server/infrastructure/dataRepository.ts:24-33`)。ファイルが存在しない場合 `readData()` は空の `{ items: [], reviews: [] }` を返す。`data/` ディレクトリは書き込み時に `mkdir -p` で自動作成される。

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

### ReviewRecord

| フィールド | 型 | 説明 |
|------|------|------|
| `id` | string (UUID) | レビューID |
| `itemId` | string | 対象アイテムのID |
| `adherence` | `"kept"` \| `"broke"` | 守れた／破った |
| `reflection` | string | 振り返りコメント |
| `reviewedAt` | string (ISO 8601) | 記録日時 |
| `attemptNumber` | number | 何回目の試みのレビューか（記録時のアイテムの `currentAttempt` を自動コピー） |

### AdherenceSummary（API応答専用、永続化されない）

| フィールド | 型 |
|------|------|
| `itemId` | string |
| `totalReviews` | number |
| `keptCount` | number |
| `brokeCount` | number |

`server/domain/reviewService.ts:36-63` ですべてのアイテムを初期化し、レビューを集計して返す。

---

## 3. API一覧

ベースパスは `/api`。リクエスト／レスポンス本体はすべて JSON。

### アイテム (`server/routes/items.ts`)

| メソッド | パス | 説明 | 成功レスポンス |
|------|------|------|------|
| GET | `/api/items` | 全アイテム取得 | `200` `NotToDoItem[]` |
| POST | `/api/items` | アイテム追加 | `201` `NotToDoItem` |
| PUT | `/api/items/:id` | アイテム更新（title・reasonのみ） | `200` `NotToDoItem` |
| DELETE | `/api/items/:id` | アイテム削除（関連レビューも一緒に削除） | `200` `{ "success": true }` |
| POST | `/api/items/:id/retry` | リトライ。`currentAttempt` を +1、`startDate` を今日にリセット | `200` `NotToDoItem` |

#### POST `/api/items` リクエスト形式

```json
{
  "title": "深夜のSNS閲覧",
  "reason": "睡眠の質が下がるため",
  "startDate": "2026-05-19",
  "targetDays": 66
}
```

- `title` と `reason` は必須（欠落時 `400 INVALID_INPUT`）
- `startDate` 省略時は今日（YYYY-MM-DD）、`targetDays` 省略時は `66`
- `id` `createdAt` `updatedAt` `currentAttempt` はサーバーが採番／設定する（`currentAttempt` は常に1で開始）

### レビュー (`server/routes/reviews.ts`)

| メソッド | パス | 説明 | 成功レスポンス |
|------|------|------|------|
| GET | `/api/reviews` | 全レビュー取得。クエリ `?itemId=...` でフィルタ可能 | `200` `ReviewRecord[]` |
| GET | `/api/reviews/summary` | 遵守率サマリー | `200` `AdherenceSummary[]` |
| POST | `/api/reviews` | レビュー追加 | `201` `ReviewRecord` |

#### POST `/api/reviews` リクエスト形式

```json
{
  "itemId": "uuid-...",
  "adherence": "kept",
  "reflection": "今日は守れた"
}
```

- 全フィールド必須。`adherence` は `"kept"` または `"broke"` のみ
- `attemptNumber` は対象アイテムの `currentAttempt` を自動コピー (`server/domain/reviewService.ts:14-33`)
- 対象アイテムが存在しない場合 `404 ITEM_NOT_FOUND`

### Import/Export (`server/routes/importExport.ts`)

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/export` | 全データをエクスポート |
| POST | `/api/import` | バックアップを一括インポート |

詳細は §6 を参照。

### エラーレスポンス形式

```json
{ "error": { "code": "INVALID_INPUT", "message": "..." } }
```

実装中のエラーコード:
- `INVALID_INPUT` (400): 必須フィールド欠落、不正な `adherence` 値、`items`/`reviews` が配列でない
- `ITEM_NOT_FOUND` (404): 対象アイテムが存在しない

---

## 4. 画面コンポーネント

クライアントはタブUIで「リスト」と「振り返り」を切り替える単一画面構成 (`client/src/App.tsx`)。データ取得は `useItems` と `useReviews` のカスタムフックに集約される。

### App.tsx
- ヘッダー（タイトル「やらないことリスト」とサブタイトル）
- タブナビゲーション (`list` / `review`)
- エラーバナーとローディングバー
- 状態フック: `useItems`、`useReviews`
- インポート後に両フックの `refresh` を並列実行

### AddItemForm (`components/AddItemForm.tsx`)
リストタブで「+ やらないことを追加」ボタンを押すと展開される。入力項目:
- やらないこと (title)
- なぜやらないか (reason, textarea)
- 開始日 (`type="date"`、デフォルトは今日)
- 習慣化目標期間: `21` / `66 (推奨)` / `90` のラジオ、または「カスタム」(1〜365)
- title・reasonが空白のみの場合は送信不可

### ItemList (`components/ItemList.tsx`)
- アイテムが0件のとき空状態を表示（「『やらないこと』はまだありません」）
- 各アイテムを `ItemCard` でレンダリング

### ItemCard (`components/ItemCard.tsx`)
1アイテムのカード。クライアント側で進捗・状態を計算して表示する (§5 参照)。
- ヘッダー: 試み番号バッジ（2回目以降のみ「N回目の挑戦」）、タイトル、削除ボタン
- 理由
- 達成バッジ（`achieved` 時）: 「習慣化達成！ N日間継続」
- 失敗メッセージ（`failed` 時）: 「破ってしまいましたが、諦めないで。」＋「リトライする」ボタン
- 進捗バー（`achieved` 以外）: 経過日数 / 目標日数、進捗率%、状態に応じたステージクラス
  - `progress-stage-1`: 0〜33%
  - `progress-stage-2`: 34〜66%
  - `progress-stage-3`: 67〜100%
- フッター: 振り返り回数、最終振り返り日、開始日

### ReviewPanel (`components/ReviewPanel.tsx`)
振り返りタブ。
- 対象アイテム選択（`select` ドロップダウン）
- 「守れましたか？」kept / broke ラジオ
- 振り返りコメント (textarea)
- アイテムがない場合は「振り返り対象のアイテムがありません。」を表示
- 「最近の振り返り」セクション: 全レビューを `reviewedAt` 降順で最新10件表示

### DataManager (`components/DataManager.tsx`)
リストタブの下部。
- 「バックアップを保存」: Markdownを生成してブラウザでダウンロード（アイテム0件のとき disabled）
- 「バックアップを読み込む」: ファイル選択 (`.md` / `.json` のみ accept)
- 成功・失敗メッセージを3秒間（成功時のみ自動消去）表示

---

## 5. アイテム状態とライフサイクル

### 状態（クライアント計算）

`client/src/types/index.ts` の `ItemStatus` は次の3値:
- `ongoing` — 継続中
- `failed` — 現在の試みで `broke` のレビューが1件でもある
- `achieved` — `broke` なしで `elapsedDays >= targetDays` に到達

判定ロジック (`client/src/components/ItemCard.tsx:22-42`):

```
currentAttemptReviews = reviews.filter(
  r => r.attemptNumber === item.currentAttempt && r.itemId === item.id
)
hasBroke = currentAttemptReviews.some(r => r.adherence === "broke")

if (hasBroke)                       → "failed"
else if (elapsed >= targetDays)     → "achieved"
else                                → "ongoing"
```

経過日数は開始日と今日の差を日単位で算出（時刻を0時0分0秒に正規化してから差分を取る）。状態判定は現在の試み（`currentAttempt`）のレビューのみを対象とする。過去の試みのレビューは状態には影響しない。

### ライフサイクル

```
[作成]
   │   POST /api/items
   ▼
[ongoing] ─── POST /api/reviews (adherence=kept) ───► [ongoing]（履歴に追加）
   │
   ├─ elapsed >= targetDays になる ──► [achieved]
   │
   └─ POST /api/reviews (adherence=broke) ──► [failed]
                                                │
                                                │  POST /api/items/:id/retry
                                                ▼
                                          [ongoing]（currentAttempt+1, startDate=今日）
```

- 作成時: `currentAttempt = 1`、`startDate` はユーザー指定 or 今日、`targetDays` はユーザー指定 or 66
- レビュー追加時: `attemptNumber` は追加時点のアイテムの `currentAttempt` をコピー
- リトライ時: `currentAttempt` を +1、`startDate` を今日にリセット、`updatedAt` を更新。過去のレビューは保持されるが、新しい `currentAttempt` の状態判定からは除外される
- 削除時: アイテムと、そのアイテムに紐づく全レビューを削除 (`server/domain/itemService.ts:75-85`)
- 「達成済み」は計算上の状態であり、永続データの状態フラグは存在しない（`achieved` 後にもレビュー追加・リトライ・削除は可能）
- 後方互換: 旧データで `currentAttempt` / `startDate` / `targetDays` / `attemptNumber` が欠落していても、それぞれ `1` / `createdAt` の日付部分 / `66` / `1` として扱う

---

## 6. Import/Export仕様

### Export

#### サーバーエンドポイント GET `/api/export`

`server/routes/importExport.ts:48-56`。レスポンス:

```json
{
  "version": "1.0",
  "exportedAt": "2026-05-19T12:34:56.789Z",
  "items": [ /* NotToDoItem[] */ ],
  "reviews": [ /* ReviewRecord[] */ ]
}
```

#### クライアント「バックアップを保存」ボタン

クライアントは `/api/export` を呼ばず、画面に表示中のデータからMarkdownを直接生成する (`client/src/lib/exportMarkdown.ts`)。ファイル名は `not-to-do-YYYY-MM-DD.md`。

Markdownには人間可読部分と機械可読のJSONブロックの両方が含まれる。

```
# やらないことリスト バックアップ
エクスポート日: YYYY/MM/DD

## <title>
**理由**: ...
**開始日**: YYYY/MM/DD
**目標**: N日
**進捗**: M/N日（P%）
**状態**: 継続中 | 失敗 | 習慣化達成
**試み**: K回目        ← currentAttempt > 1 のときのみ

### 振り返り履歴（第K回目の挑戦）
| 日付 | 結果 | コメント |
| ... | 守れた／破った | ... |

---

<!--BACKUP_DATA
{ "version": "1.0", "exportedAt": "...", "items": [...], "reviews": [...] }
-->
```

- 振り返り履歴セクションは「現在の試み」のレビューのみが対象 (`exportMarkdown.ts:25-27`)
- コメント内の `|` は全角 `｜` に置換される（表崩れ防止）
- 状態の文字列はクライアント計算で `失敗` / `習慣化達成` / `継続中` の3値

### Import

#### サーバーエンドポイント POST `/api/import`

リクエスト本体は `{ items: NotToDoItem[], reviews: ReviewRecord[] }`。マージ規則 (`server/routes/importExport.ts:13-45`):
- 既存データに対し、`id` をキーとした Map で重ね合わせる
- インポート側に同じ `id` があれば**上書き**、新規 `id` は**追加**
- `items` または `reviews` が配列でなければ `400 INVALID_INPUT`

レスポンス:

```json
{ "success": true, "importedItems": 3, "importedReviews": 7 }
```

#### クライアント「バックアップを読み込む」ボタン

選択可能な拡張子は `.md` / `.json`（`DataManager.tsx`）。

`client/src/lib/importMarkdown.ts:42-55` の `parseBackupFile`:
- `.md`: `<!--BACKUP_DATA\n...\n-->` コメントを正規表現で抽出し、内側をJSONとしてパース。見つからなければ「バックアップデータが見つかりません」エラー
- `.json`: 全体をJSONとしてパース。`items` または `reviews` フィールドが欠落していればエラー
- 拡張子不明: Markdown形式 → JSON形式の順でフォールバック

パース後、`api.importBackup` で `/api/import` に POST し、完了後に `useItems` と `useReviews` の `refresh` を並列実行して画面を更新する。

注: `mergeBackupData` 関数 (`importMarkdown.ts:58-77`) はクライアント側にも同じマージロジックを持つが、現在の UI フローでは未使用（マージはサーバー側で実行される）。
