# 2026-05-24 Task 3 日誌（遡及記録）

## 取り組んだこと

Task 3「ユーザー切り替えの最小実装」の実装内容をコードから遡及して記録する。日誌自体は作業後になってしまった。

## 実装したもの

### AuthContext（`client/src/contexts/AuthContext.tsx`）

端末内でのローカルユーザー切り替えを実装。

- **ストレージキー**: `not-to-do.currentUser`
- **初期値**: localStorage に保存がなければ `userA`、`"userB"` があれば `userB`
- **モード**: `"local"`（ローカルユーザー）

| 関数 | 動作 |
|------|------|
| `switchUser(userId)` | `localStorage` に userId を保存してstate更新 |
| `login(provider)` | `alert("近日公開です")`（プレースホルダー） |
| `logout()` | userA にリセット |

### 型定義（`client/src/types/index.ts`）

```ts
type UserId = "userA" | "userB";
```

### App.tsx でのフィルタリング

`getOwnerId()` 関数で userId を owner にマッピングし、アイテム・レビュー・サマリーをユーザーごとにフィルタリングして表示を分ける。

### localStorage 構造

```
"not-to-do.currentUser" => "userA" | "userB"
```

## 未実装（プレースホルダー）

- 外部認証（Google 等）
- 本格ログイン

## 完了条件の達成状況

- ✅ `user_id` の生成（UserId型 = userA/userB）
- ✅ 現在ユーザーの保持（localStorage + state）
- ✅ ユーザー一覧（userA / userB ボタン）
- ✅ 切り替え（switchUser）
- ✅ userA と userB の表示が分かれる（getOwnerId フィルタ）
