# NotToDo 環境固定コマンド

> **目的:** プロジェクトを開いたときに、どのツールのどの版を使うかを迷わないようにする。
>
> **方針:** 版固定はリポジトリに残す。ホスト側に依存するものは最小限にし、再現性の高いコマンドを優先する。

---

## 1. 前提

- Flutter は FVM で固定する
- Node / Python / 補助 CLI は mise で固定する
- サーバー系は Docker Compose に寄せる
- 実機デバッグはホスト側で行う

---

## 2. Flutter / FVM

### 初回セットアップ
```bash
fvm install
fvm use
```

### 実行
```bash
fvm flutter pub get
fvm flutter run
fvm flutter test
```

### 確認
```bash
fvm flutter --version
```

---

## 3. mise

### 初回セットアップ
```bash
mise install
```

### 利用
```bash
mise use
mise ls
```

### 確認
```bash
mise current
```

---

## 4. Docker Compose

### 起動
```bash
docker compose up -d
```

### 停止
```bash
docker compose down
```

### 状態確認
```bash
docker compose ps
```

---

## 5. 推奨する開発コマンドの入口

`make` か `just` のどちらかで統一する。初期は最小限でよい。

### 例
```bash
make dev
make test
make lint
```

---

## 6. 完了条件

- 主要ツールの起動コマンドが文書化されている
- バージョン固定方法が明記されている
- ホスト側と Docker 側の役割が分かる
