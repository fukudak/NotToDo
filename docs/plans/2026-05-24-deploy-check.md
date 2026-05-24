# デプロイ確認（Firebase Hosting）— 2026-05-24

## 確認結果

### ✅ Vite ビルド
```
vite build → ✓ built in 413ms
client/dist/index.html         0.41 kB
dist/assets/index-*.css       13.82 kB
dist/assets/index-*.js       217.77 kB
```

### ❌ Firebase Hosting 設定：未整備

| 項目 | 状態 |
|------|------|
| `firebase.json`（ルート/クライアント両方） | 存在しない |
| `.firebaserc` | 存在しない |
| `firebase-tools.json` | 存在するが 2 bytes（空・認証なし） |

### Firebase CLI 認証
```
$ firebase projects:list
Error: Failed to authenticate
```
認証が必要。`firebase login --no-localhost`（CI用token使用）または
別途認証が必要。

### 必要な作業
1. `firebase init hosting` で `firebase.json` と `.firebaserc` を作成
2. `firebase login` または CI token で認証
3. `firebase deploy` で公開
4. CI/CD（GitHub Actions等）の設定も未着手

## メモ
- 仕様では `client/dist/` をホスティングする想定
- firebase CLI v15.18.0 はインストール済み（`/root/.hermes/node/bin/`）
- デプロイ作業とCI/CDは別タスクとして残す
