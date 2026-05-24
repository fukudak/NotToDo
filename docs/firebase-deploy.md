# NotToDo Firebase Hosting デプロイ手順

> VPS（`ssh hermes`）上で実行する想定
> 現在の状態: `vite build` 成功済み、`firebase.json` / `.firebaserc` 未整備、認証未済

---

## Step 1: Firebase CLI でログイン

```bash
# ブラウザで Firebase にログイン（CI/CD用トークンでも可）
# --no-localhost は port forwarding が困難なVPS環境向け
firebase login --no-localhost

# または CI token を使う場合（ローカルマシンで発行してVPSに渡す）
# firebase_login_ci_token=xxxxxxxxxxxxxxxxxxxx
# firebase deploy --token "$firebase_login_ci_token"
```

**確認:**
```bash
firebase projects:list
```
→ プロジェクト一覧が表示されれば OK。

---

## Step 2: プロジェクトを選択して初期化

```bash
cd /root/NotToDo
firebase use --add
```

表示される対話で:
1. 既存プロジェクトを選択（または新規作成）
2. エイリアス名を入力（例: `default`）

**確認:**
```bash
cat .firebaserc
```
→ 対応する JSON が出力されれば OK。

---

## Step 3: `firebase.json` を作成

プロジェクトルートで初期化（`client/dist` をホスティング対象にする）。

```bash
firebase init hosting
```

対話の選択肢:
- `hosting` を選択
- デフォルトの公開フォルダ: `client/dist` と入力（デフォルトの `public` ではない！）
- Single-page app: `y`（エントリポイントを `index.html` にリライトするため）
- GitHub Actions 連携: `N`（今回は手動デプロイ）

生成される `firebase.json`（想定）:
```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Step 4: プロジェクトID の確認

```bash
cat .firebaserc
```

例の出力:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

プロジェクトID を `your-project-id` に置き換えてメモ。

---

## Step 5: `firebase deploy`

```bash
firebase deploy --only hosting
```

成功したら以下のURLが表示される:
```
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

---

## Step 6: 動作確認

ブラウザで公開URLを開き、以下を確認:
1. ホーム画面（「やらないことリスト」タイトル表示）
2. タブ切り替え（リスト/振り返り/編集/設定）
3. アイテム追加 → localStorage 永続化確認
4. 振り返り機能
5. エクスポート/インポート → 実際にmdファイルがDLされるか

---

## CI/CD（GitHub Actions）への拡張

手動デプロイの次に自動化する場合は:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v3
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: your-project-id
          channelId: live
```

`FIREBASE_SERVICE_ACCOUNT` には Firebase Console > プロジェクト設定 > サービスアカウント > 秘密鍵 の JSON を base64 したものを secrets に登録する。
