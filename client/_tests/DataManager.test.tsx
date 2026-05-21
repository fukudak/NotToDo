import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataManager } from "../src/components/DataManager";
import type { NotToDoItem, ReviewRecord } from "../src/types";

const mockItems: NotToDoItem[] = [
  {
    id: "item-1",
    title: "テストアイテム",
    reason: "テスト理由",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startDate: "2026-01-01",
    targetDays: 66,
    currentAttempt: 1,
    userId: "userA",
  },
];

const mockReviews: ReviewRecord[] = [
  {
    id: "review-1",
    itemId: "item-1",
    adherence: "kept",
    reflection: "テスト振り返り",
    reviewedAt: "2026-01-02T00:00:00.000Z",
    attemptNumber: 1,
    userId: "userA",
  },
];

const backupJson = JSON.stringify({
  version: "1.0",
  exportedAt: "2026-01-01T00:00:00.000Z",
  items: mockItems,
  reviews: mockReviews,
});

describe("DataManager - JSONエクスポート", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("「📥 エクスポート」ボタンがレンダリングされる", () => {
    render(
      <DataManager
        items={mockItems}
        reviews={mockReviews}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /エクスポート/ })).toBeInTheDocument();
  });

  it("エクスポートボタンをクリックするとBlob URLが作成されダウンロードが発火する", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <DataManager
        items={mockItems}
        reviews={mockReviews}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /エクスポート/ }));

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("ダウンロードファイル名はnot-to-do-backup-YYYY-MM-DD.json形式", async () => {
    const downloadNames: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadNames.push(this.download);
    });

    const user = userEvent.setup();
    render(
      <DataManager
        items={mockItems}
        reviews={mockReviews}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /エクスポート/ }));

    expect(downloadNames[0]).toMatch(/^not-to-do-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe("DataManager - JSONインポート", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
        const url = String(input);
        if (url === "/api/import" && options?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ success: true, importedItems: 1, importedReviews: 1 }),
          };
        }
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("JSONファイルを選択するとアイテム数・レビュー数のプレビューが表示される", async () => {
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));

    expect(screen.getByText("アイテム数: 1件")).toBeInTheDocument();
    expect(screen.getByText("レビュー数: 1件")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "インポート実行" })).toBeInTheDocument();
  });

  it("インポート実行ボタンクリックで確認ダイアログが表示される", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "インポート実行" }));

    expect(confirmSpy).toHaveBeenCalledWith("既存のデータに追加します。続けますか？");
  });

  it("確認ダイアログでキャンセルするとインポートが中止される", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onImportComplete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userA"
        onImportComplete={onImportComplete}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "インポート実行" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(onImportComplete).not.toHaveBeenCalled();
  });

  it("確認OKでインポートが実行されデータが再取得される", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onImportComplete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userA"
        onImportComplete={onImportComplete}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "インポート実行" }));

    await waitFor(() => {
      expect(onImportComplete).toHaveBeenCalled();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/import",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("インポート完了後に成功メッセージが表示される", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userA"
        onImportComplete={async () => {}}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "インポート実行" }));

    await waitFor(() => {
      expect(screen.getByText(/インポート完了/)).toBeInTheDocument();
    });
  });

  it("インポート時にuserIdがcurrentUserに設定される", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <DataManager
        items={[]}
        reviews={[]}
        currentUser="userB"
        onImportComplete={async () => {}}
      />,
    );

    const input = screen.getByTestId("json-import-input");
    await user.upload(input, new File([backupJson], "backup.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "インポート実行" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body.items[0].userId).toBe("userB");
    expect(body.reviews[0].userId).toBe("userB");
  });
});
