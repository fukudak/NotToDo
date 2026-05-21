# NotToDo JSON データスキーマ

> **目的:** 端末内保存の JSON 構造を固定し、ユーザー分離・件数制限・課金連携・将来のログイン接続を壊さず進められるようにする。
>
> **方針:** MVP ではシンプルに、将来の拡張で困らないだけの余白を持たせる。最初から巨大な正規化はしないが、`user_id` と `plan` は早めに持つ。

---

## 1. 設計原則

- `user_id` を分離の軸にする
- `plan` と `maxItems` を権限制御に使う
- 1 つの JSON で複数ユーザーを扱えるようにする
- ユーザー切り替えと課金判定を別レイヤーにする
- ローカル保存でも将来のサーバー同期に流用しやすくする

---

## 2. ルート構造

```json
{
  "version": 1,
  "activeUserId": "u_001",
  "users": {
    "u_001": {
      "userId": "u_001",
      "displayName": "マリ",
      "plan": "free",
      "maxItems": 20,
      "featureFlags": {
        "export": true,
        "import": true,
        "sync": false,
        "backup": false
      },
      "items": [
        {
          "id": "item_001",
          "title": "夜にカフェインを取らない",
          "reason": "睡眠の質を落としたくない",
          "status": "active",
          "createdAt": "2026-05-20T12:00:00Z",
          "updatedAt": "2026-05-20T12:00:00Z"
        }
      ],
      "meta": {
        "createdAt": "2026-05-20T12:00:00Z",
        "updatedAt": "2026-05-20T12:00:00Z"
      }
    }
  }
}
```

---

## 3. フィールド定義

### 3-1. Root

| フィールド | 型 | 説明 |
|---|---|---|
| `version` | number | スキーマバージョン。将来の移行用 |
| `activeUserId` | string \| null | 現在選択中のユーザー |
| `users` | record<string, UserData> | ユーザーごとのデータ本体 |

### 3-2. UserData

| フィールド | 型 | 説明 |
|---|---|---|
| `userId` | string | ユーザーID。キーと一致させる |
| `displayName` | string | 表示名 |
| `plan` | `free` \| `pro` | 課金プラン |
| `maxItems` | number | 登録可能な項目数の上限 |
| `featureFlags` | object | 機能可否の辞書 |
| `items` | Item[] | やらないこと項目の配列 |
| `meta` | object | ユーザー単位のメタ情報 |

### 3-3. Item

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | string | 項目ID |
| `title` | string | やらないことの短い名前 |
| `reason` | string | その理由 |
| `status` | `active` \| `archived` \| `done` | 現在の状態 |
| `createdAt` | string | ISO 8601 |
| `updatedAt` | string | ISO 8601 |

### 3-4. featureFlags

| フラグ | 型 | 説明 |
|---|---|---|
| `export` | boolean | JSON エクスポート可否 |
| `import` | boolean | JSON インポート可否 |
| `sync` | boolean | 端末間同期可否 |
| `backup` | boolean | バックアップ機能可否 |

---

## 4. 無料 / 有料の初期値

### 無料版
- `plan`: `free`
- `maxItems`: `20`
- `export`: `true`
- `import`: `true`
- `sync`: `false`
- `backup`: `false`

### 有料版
- `plan`: `pro`
- `maxItems`: `null` か十分大きい値
- `export`: `true`
- `import`: `true`
- `sync`: `true`
- `backup`: `true`

> 注: 実装では `maxItems: null` と「無制限」を表すか、上限値を十分大きくするかを別途統一する。

---

## 5. バージョニング方針

- スキーマは `version` で識別する
- 破壊的変更があれば新バージョンを追加する
- マイグレーションは、読込時に古い版を新しい版へ変換する
- 旧版を書き戻すときは、できるだけ新形式に揃える

---

## 6. 将来拡張の余地

この構造を保ったまま、次を足せる。

- `reviews` 配列
- バックアップ履歴
- 同期ステータス
- 課金レシート情報
- 外部ログインIDとの対応表

ただし、MVP では **items と user 情報だけで十分**。

---

## 7. 実装順

1. Root / UserData / Item の型を決める
2. `maxItems` と `plan` を表示に反映する
3. ユーザー切り替えで `activeUserId` を更新する
4. 保存 / 復元で `version` を読む
5. 将来の `reviews` と同期を足せるように余白を残す

---

## 8. 完了条件

- 保存形式が 1 つの文書で説明できる
- user 単位の分離と課金判定の両方を表現できる
- 将来のログインや同期の追加で崩れない
- スキーマ移行の入口がある
