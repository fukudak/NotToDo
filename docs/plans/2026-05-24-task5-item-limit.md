# 2026-05-24 Task 5 日誌（遡及記録）

## 取り組んだこと

Task 5「件数制限を実装する」の実装内容をコードから遡及して記録する。

## 実装したもの

### プラン定義

```ts
interface UserPlan {
  userId: UserId;
  plan: "free" | "pro";
  maxItems: number;
}
```

### プラン取得・設定（ストレージ）

| 関数 | 説明 |
|------|------|
| `getPlan(userId)` | localStorage から取得。未設定時は `free / maxItems: 3` を返す |
| `setPlan(userId, plan, maxItems)` | localStorage に保存 |

### usePlan フック（`hooks/usePlan.ts`）

- 同期的に localStorage から初期化
- `userId` が変わったら `useEffect` で再取得

### 件数制限UI（`App.tsx`）

```ts
const maxItems = plan?.maxItems ?? 3;
const isAtLimit = visibleItems.length >= maxItems;
```

- `isAtLimit` を `AddItemForm` に渡す
- 上限到達時、`AddItemForm` は入力フォームの代わりに
  「無料版は N 件までです」 + 「アップグレード」ボタンを表示

### AddItemForm プレースホルダー

無料版上限到達時の表示（`isAtLimit` 時のレンダリング）:
- `plan-limit-notice` クラスのコンテナ
- 「無料版は {maxItems} 件までです」
- 「アップグレード」ボタン → 設定タブへ遷移

### テスト

既存テスト `AddItemFormLimit.test.tsx` が上限ブロックを検証。

## 仕様矛盾（後日対応）

spec-v2.md で記録済みだが、現在の状態:
- UpgradePrompt（設定タブ）は「3件まで」を無料版制限として表示 → ✅ 整合
- エクスポートは無料版でも可能だが UpgradePrompt には反映されていない
  → spec-v2更新時に「エクスポート可」に修正して解消済み

## 完了条件

- ✅ 上限に達したら追加フォームがブロックされる（UI側）
- ✅ 無料 3件 / 有料無制限 の切り替えが `setPlan` で可能
- ⚠️ 上限に達した状態で API 呼び出しをブロックするサーバー側バリデーションは存在しない（完全クライアントサイドなので実質ブロックできない）
