# クライアントサイド テスト設計

対象: `client/` 配下の React 19 + Vite + TypeScript 構成
前提: ルート `vitest.config.ts` は現状 `server/_tests/**` のみを対象にしている（`environment: "node"`）

---

## 1. テストツール選定

### 結論
以下を `devDependencies` に追加する（ルート `package.json` に統一する。`vitest` 本体はすでにルートに入っているため、クライアント個別のpackageを作らずルートから `npm test` を実行する）。

| パッケージ | 役割 | 必須か |
|---|---|---|
| `jsdom` | ブラウザ環境のエミュレーション。`document`, `window`, `fetch` 周りを利用する `downloadMarkdown` などのテストに必要 | 必須 |
| `@testing-library/react` | React 19 用のレンダラとクエリ。ユーザー視点で DOM をアサート | 必須 |
| `@testing-library/jest-dom` | `toBeInTheDocument` / `toBeDisabled` などのカスタムマッチャ | 必須 |
| `@testing-library/user-event` v14 | `userEvent.setup()` でリアルな入力イベントを発火（`fireEvent` より推奨） | 必須 |
| `@types/jsdom` | 型補完 | あれば便利 |

### 採用しないもの
- **MSW**: 本プロジェクトの API クライアント (`client/src/api/client.ts`) は単純な関数群で、フックは `import * as api from "../api/client"` で取り込んでいる。`vi.mock("../api/client")` で十分にモックできるため MSW は過剰。
- **Playwright / Cypress (E2E)**: スコープ外。本設計は単体・結合（コンポーネント）テストに限定する。

### React 19 注意点
- `@testing-library/react` は 16.x 以降で React 19 をサポート。インストール時はバージョンを明示する（`@testing-library/react@^16`）。
- `act()` のラッピングは RTL の `render` / `userEvent` 内で自動的に行われるため通常は意識しなくてよい。

---

## 2. `vitest.config.ts` のクライアント対応

現状（`server/_tests/**/*.test.ts` のみ、node 環境）:

```ts
// vitest.config.ts (現状)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/_tests/**/*.test.ts"],
  },
});
```

クライアントは jsdom 環境かつ JSX を扱う必要がある。**Vitest の Workspaces (projects 機能) で server/client を分離する**のが構成的にきれい。

### 改修案: ルート `vitest.config.ts` を projects 構成にする

```ts
// vitest.config.ts (改修後)
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // サーバー（既存）
        test: {
          name: "server",
          environment: "node",
          include: ["server/_tests/**/*.test.ts"],
        },
      },
      {
        // クライアント（新規）
        plugins: [react()],
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/_tests/**/*.test.{ts,tsx}"],
          setupFiles: ["./client/_tests/setup.ts"],
          globals: false, // 明示的に import する方針
        },
      },
    ],
  },
});
```

- `@vitejs/plugin-react` はクライアント側にすでに入っている。ルートにも `devDependencies` として追加する必要がある（または `client/package.json` から hoist させる）。
- `globals: false` を維持し、`describe / it / expect / vi` は `import { ... } from "vitest"` で明示する（既存サーバーテストの方針と揃える）。

### `client/_tests/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

### 実行コマンド
ルート `package.json` の `test` スクリプトはそのままで両 project が走る。個別実行は:

```bash
bunx vitest run --project=server
bunx vitest run --project=client
```

---

## 3. テスト対象の優先順位

実装の確認に基づき、**ロジックの密度 × 壊れやすさ × ユーザー導線の重要性** で並べた。

### 優先度 P1（最初に書く）

#### (a) `client/src/lib/importMarkdown.ts`
- 純粋関数 (`parseBackupFile`, `mergeBackupData`)、副作用なし、jsdom も不要（ただし projects 設定では jsdom で動かす）。
- 入出力が定義済みで、エッジケースが多い（`.md`/`.json`/拡張子不明、BACKUP_DATA コメントの有無、items/reviews フィールドの欠落）。
- **ここから始めるのが最もコスパが高い**。

ケース例:
- `.md` ファイルから `<!--BACKUP_DATA ... -->` 内の JSON を抽出できる
- BACKUP_DATA コメントがない `.md` はエラーを投げる
- `.json` ファイルで `items`/`reviews` を含むものはパースできる
- `.json` ファイルでフィールド欠落時はエラーを投げる
- 拡張子不明時、Markdown 形式を先に試し、失敗したら JSON にフォールバックする
- `mergeBackupData` は同一 ID で上書き、新規 ID は追加する

#### (b) `client/src/lib/exportMarkdown.ts`
- `generateMarkdown` は純粋関数。状態文字列（継続中／達成／失敗）の分岐が `ItemCard` の `calcProgress` と二重定義になっており、ここでテストすることで挙動の保証地点になる。
- `downloadMarkdown` は DOM (`URL.createObjectURL`, `document.createElement("a")`) を触るため jsdom 必須。`URL.createObjectURL` は jsdom にない可能性が高いので **スタブする必要がある**（後述）。

ケース例:
- 0件のとき `_まだアイテムがありません。_` 行が出る
- 1件のとき `## {title}` / `**理由**` / `**進捗**` 行が出る
- `BACKUP_DATA` コメントが末尾に埋め込まれ、その中身が `JSON.parse` で `{ version, exportedAt, items, reviews }` に戻せる
- レビューコメント中の `|` が全角 `｜` にエスケープされる
- `attemptNumber` が `currentAttempt` と一致するレビューだけが履歴に出る

`downloadMarkdown` 側はスモークテスト（呼び出しでエラーが出ない・`a.click()` が呼ばれる）程度で十分。

### 優先度 P2（次に書く）

#### (c) `client/src/components/ItemCard.tsx`
- `calcElapsedDays` / `calcProgress` / `progressStageClass` の分岐が密。UI 表示文言（"あと N 日" / "達成済み" / "今回の試みは失敗"）はユーザーに見えるテキストなので RTL の `getByText` でアサートしやすい。
- 日付ロジックがあるため `vi.setSystemTime` を必ず使う。

ケース例（`vi.setSystemTime(new Date("2026-05-19"))` で固定）:
- `startDate: "2026-05-01"`, `targetDays: 66`, レビューなし → "あと 48 日", `status-ongoing`
- 同上で `broke` レビューが1件 → "今回の試みは失敗"、"リトライする" ボタンが表示
- `startDate: "2025-01-01"`, `targetDays: 66`, レビューなし → "達成済み"、達成バッジ表示
- `currentAttempt: 2` のとき "2回目の挑戦" バッジが表示される
- レビューが当該 attempt のもの **でない**（`attemptNumber` 不一致）場合、失敗扱いにならない
- 削除ボタンクリックで `onDelete(item.id)` が呼ばれる
- リトライボタンクリックで `onRetry(item.id)` が呼ばれる

#### (d) `client/src/components/AddItemForm.tsx`
- フォーム送信は本アプリの主要導線。`useState` の数が多く、リセット挙動・送信中無効化・カスタム日数の分岐などが壊れやすい。

ケース例:
- 必須項目（title, reason）が空のとき送信ボタンが `disabled`
- 入力後にラジオで "21日" を選び送信すると `onAdd(title, reason, startDate, 21)` で呼ばれる
- カスタムを選び `100` を入れて送信すると `targetDays: 100` で呼ばれる
- カスタムで空のまま送信すると `66`（フォールバック）で呼ばれる
- 送信完了後、入力欄が初期化される
- 送信中（Promise pending）はボタンが "追加中..." になり disabled

### 優先度 P3（余力があれば）

#### (e) `client/src/hooks/useItems.ts` / `useReviews.ts`
- API クライアントを `vi.mock` して、`renderHook` でフックを単体テスト。
- 初回マウントで `fetchItems` が呼ばれる／`addItem` で楽観更新される／エラー時 `error` がセットされる、など。

#### (f) `client/src/components/ReviewPanel.tsx`
- フォーム送信、最近のレビュー履歴ソート（新しい順10件）、削除済みアイテムの表記。

#### (g) `client/src/components/DataManager.tsx`
- ファイル `<input type="file">` のテストは jsdom で書きづらい (`File` オブジェクトを手で作る)。`api.importBackup` モック + `userEvent.upload` で書ける。エクスポートは `downloadMarkdown` 経由で副作用が大きいので、`generateMarkdown` のテストでカバー済みなら薄く済ませる。

#### (h) `client/src/App.tsx`
- 結合テスト1本程度。タブ切替、`addItem` 後に `refreshReviews` が呼ばれること。ほぼ配線確認なので最小限。

### スキップ
- `client/src/main.tsx`: エントリポイント、テスト不要。
- `index.css`: スタイルは対象外。

---

## 4. API クライアントのモック方法

`client/src/api/client.ts` は `fetch` ラッパーで、エクスポートしている関数群を **フック側が `import * as api from "../api/client"` で取り込んでいる**。これは `vi.mock` でモジュール全体を差し替えるのに最適なパターン。

### パターン A: `vi.mock` で API モジュールを丸ごと差し替え（推奨）

**フックや、フックを使うコンポーネントのテストではこれ一択。** `fetch` を触る必要がないので一番シンプル。

```ts
// client/_tests/hooks/useItems.test.ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/api/client", () => ({
  fetchItems: vi.fn(),
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  retryItem: vi.fn(),
  updateItem: vi.fn(),
  fetchReviews: vi.fn(),
  createReview: vi.fn(),
  fetchAdherenceSummary: vi.fn(),
  importBackup: vi.fn(),
}));

import * as api from "../../src/api/client";
import { useItems } from "../../src/hooks/useItems";

const mockedFetchItems = vi.mocked(api.fetchItems);
const mockedCreateItem = vi.mocked(api.createItem);

describe("useItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初回マウントで fetchItems を呼んで items に反映する", async () => {
    mockedFetchItems.mockResolvedValue([
      {
        id: "1",
        title: "SNS",
        reason: "時間の無駄",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        startDate: "2026-01-01",
        targetDays: 66,
        currentAttempt: 1,
      },
    ]);
    const { result } = renderHook(() => useItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  it("addItem 成功時に楽観更新される", async () => {
    mockedFetchItems.mockResolvedValue([]);
    mockedCreateItem.mockResolvedValue({
      id: "2",
      title: "夜更かし",
      reason: "睡眠",
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
      startDate: "2026-05-19",
      targetDays: 66,
      currentAttempt: 1,
    });
    const { result } = renderHook(() => useItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.addItem("夜更かし", "睡眠", "2026-05-19", 66);
    });
    expect(result.current.items).toHaveLength(1);
    expect(mockedCreateItem).toHaveBeenCalledWith("夜更かし", "睡眠", "2026-05-19", 66);
  });
});
```

サーバー側テスト (`server/_tests/items.test.ts`) と同じ `vi.mock` + `vi.mocked` パターンで揃えると、プロジェクト全体の作法が一貫する。

### パターン B: `global.fetch` をスタブする

`client.ts` の `request()` 自身をテストしたい場合や、API クライアントの内部（ヘッダ、エラー整形）を直接検証したい場合のみ使う。

```ts
// client/_tests/api/client.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createItem, fetchItems } from "../../src/api/client";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it("fetchItems は /api/items に GET する", async () => {
  const mockedFetch = vi.mocked(fetch);
  mockedFetch.mockResolvedValue(
    new Response(JSON.stringify([]), { status: 200 }),
  );
  await fetchItems();
  expect(mockedFetch).toHaveBeenCalledWith(
    "/api/items",
    expect.objectContaining({
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }),
  );
});

it("4xx 応答時は body.error.message を Error として投げる", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ error: { code: "x", message: "失敗" } }), {
      status: 400,
    }),
  );
  await expect(createItem("a", "b", "2026-05-19", 66)).rejects.toThrow("失敗");
});
```

`Response` / `fetch` は jsdom 環境で利用可能（undici 由来）。

### 使い分け
| テスト対象 | 推奨パターン |
|---|---|
| `useItems`, `useReviews` | A (`vi.mock`) |
| `AddItemForm`, `ReviewPanel`, `ItemCard`（API呼ばない props 受け取り型） | モック不要、`onAdd` などを `vi.fn()` で渡す |
| `DataManager`（`api.importBackup` を直接呼ぶ） | A (`vi.mock`) |
| `App.tsx`（全部繋ぐ結合テスト） | A (`vi.mock` でフックが内部で使う API を一括差し替え) |
| `api/client.ts` 自体の挙動 | B (`vi.stubGlobal("fetch", ...)`) |

### `URL.createObjectURL` のスタブ
`exportMarkdown.ts` の `downloadMarkdown` を呼ぶテストでは、jsdom に `URL.createObjectURL` がないため必要に応じてスタブする:

```ts
beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });
});
```

---

## 5. ディレクトリ構成

```
client/_tests/
  setup.ts                       # jest-dom 拡張 + cleanup
  TEST-DESIGN.md                 # 本ファイル
  lib/
    importMarkdown.test.ts       # P1
    exportMarkdown.test.ts       # P1
  components/
    ItemCard.test.tsx            # P2
    AddItemForm.test.tsx         # P2
    ReviewPanel.test.tsx         # P3
    DataManager.test.tsx         # P3
  hooks/
    useItems.test.ts             # P3
    useReviews.test.ts           # P3
  api/
    client.test.ts               # P3（パターン B でラッパー検証）
  app/
    App.test.tsx                 # P3（結合 1〜2 ケース）
```

サーバー側 (`server/_tests/`) と階層を揃えてあるので、`npm test` 実行時に両 project の出力を見比べやすい。

---

## 6. 導入手順サマリ

1. ルートに devDependency を追加: `jsdom`, `@testing-library/react@^16`, `@testing-library/jest-dom`, `@testing-library/user-event@^14`, `@vitejs/plugin-react`
2. `vitest.config.ts` を projects 構成に書き換え（§2）
3. `client/_tests/setup.ts` を作成（§2）
4. P1 から順に `.test.ts` / `.test.tsx` を追加
5. `npm test` で server + client 両方が緑になることを確認
