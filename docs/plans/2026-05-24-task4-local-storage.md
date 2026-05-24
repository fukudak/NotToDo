# 2026-05-24 Task 4 日誌（遡及記録）

## 取り組んだこと

Task 4「ローカル保存を実装する」の実装内容をコードから遡及して記録する。

## 実装したもの

### ストレージ層（`client/src/lib/storage.ts`）

localStorage への全読み書きを担当。キーは3つ:

| キー | 型 |
|------|-----|
| `not-to-do-items` | `NotToDoItem[]` |
| `not-to-do-reviews` | `ReviewRecord[]` |
| `not-to-do-plan` | `Record<UserId, { plan, maxItems }>` |

### アイテム操作

| 関数 | 説明 |
|------|------|
| `getItems()` | localStorage から同期的に読み込み、パース失敗時は空配列 |
| `addItem(title, reason, startDate, targetDays, userId?)` | UUID採番、`createdAt`/`updatedAt`/`currentAttempt:1` を設定。`userId` は渡された場合のみ付与 |
| `updateItem(id, data)` | 既存アイテムを部分更新、`updatedAt` を現在時刻に。IDが見つからなければ throw |
| `deleteItem(id)` | アイテムを削除し、関連するレビューもまとめて削除 |

### レビュー操作

| 関数 | 説明 |
|------|------|
| `getReviews()` | localStorage から読み込み |
| `addReview(itemId, adherence, reflection, userId?)` | UUID採番、`reviewedAt` 設定、`attemptNumber` を対象アイテムの `currentAttempt` から自動コピー（アイテムがなければ 1） |
| `computeSummary(reviews)` | アイテムごとに `totalReviews`/`keptCount`/`brokeCount` を集計 |

### エクスポート / インポート

| 関数 | 説明 |
|------|------|
| `exportAll()` | 全データを JSON 文字列化 |
| `importAll(jsonString)` | JSON をパースし、ID をキーに Map で重ね合わせ（重複は上書き、新規は追加） |

### エラーハンドリング

- すべての `localStorage.getItem/JSON.parse` は try/catch で囲み、失敗時は安全な既定値を返す
- `saveItems/saveReviews` も try/catch で囲み、書き込み失敗時は静かに無視

### テスト（`client/_tests/lib/storage.test.ts`）

21テスト。アイテム操作・レビュー操作・サマリー計算・プラン・エクスポート/インポートを網羅。

## 完了条件

- ✅ アプリを閉じてもデータが残る（localStorage 永続化）
- ✅ 追加・編集・削除が localStorage を介して動作
- ✅ レビュー追加時 `attemptNumber` が自動コピーされる
- ✅ deleteItem で関連レビューもまとめて削除
