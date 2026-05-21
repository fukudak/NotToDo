import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotToDoData } from "../domain/types.ts";

vi.mock("../infrastructure/dataRepository.ts", () => ({
  readData: vi.fn(),
  writeData: vi.fn(),
}));

// planRepository をモックして既存テストへの影響を防ぐ（proプランで件数制限なし）
vi.mock("../infrastructure/planRepository.ts", () => ({
  readPlans: vi.fn().mockResolvedValue({
    plans: [
      { userId: "userA", plan: "pro", maxItems: 9999 },
      { userId: "userB", plan: "pro", maxItems: 9999 },
    ],
  }),
  writePlans: vi.fn(),
}));

import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { addItem, deleteItem, getAllItems, retryItem, updateItem } from "../domain/itemService.ts";

const mockedReadData = vi.mocked(readData);
const mockedWriteData = vi.mocked(writeData);

const baseItem = {
  id: "abc",
  title: "SNSを見ない",
  reason: "時間の無駄",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  targetDays: 66,
  currentAttempt: 1,
};

describe("itemService", () => {
  beforeEach(() => {
    mockedReadData.mockReset();
    mockedWriteData.mockReset();
    mockedWriteData.mockResolvedValue(undefined);
  });

  describe("getAllItems", () => {
    it("空のストアから空配列を返す", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });
      const items = await getAllItems();
      expect(items).toEqual([]);
    });

    it("ストア内のアイテムをそのまま返す", async () => {
      const stored: NotToDoData = {
        items: [{ ...baseItem }],
        reviews: [],
      };
      mockedReadData.mockResolvedValue(stored);
      const items = await getAllItems();
      expect(items).toHaveLength(1);
      expect(items[0]!.title).toBe("SNSを見ない");
    });
  });

  describe("addItem", () => {
    it("必須フィールドのみでアイテムを追加できる", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });

      const result = await addItem({ title: "SNSを見ない", reason: "時間の無駄" });

      expect(result.title).toBe("SNSを見ない");
      expect(result.reason).toBe("時間の無駄");
      expect(result.id).toBeTruthy();
      expect(result.targetDays).toBe(66);
      expect(result.currentAttempt).toBe(1);
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockedWriteData).toHaveBeenCalledOnce();
    });

    it("追加後、getAllItems で取得できる", async () => {
      const store: NotToDoData = { items: [], reviews: [] };
      mockedReadData.mockImplementation(async () => ({
        ...store,
        items: [...store.items],
      }));
      mockedWriteData.mockImplementation(async (data: NotToDoData) => {
        store.items = [...data.items];
        store.reviews = [...data.reviews];
      });

      await addItem({ title: "SNSを見ない", reason: "時間の無駄" });
      const items = await getAllItems();

      expect(items).toHaveLength(1);
      expect(items[0]!.title).toBe("SNSを見ない");
    });
  });

  describe("updateItem", () => {
    it("タイトルと理由を更新できる", async () => {
      mockedReadData.mockResolvedValue({ items: [{ ...baseItem }], reviews: [] });

      const result = await updateItem("abc", { title: "ゲームをしない", reason: "集中できない" });

      expect(result.id).toBe("abc");
      expect(result.title).toBe("ゲームをしない");
      expect(result.reason).toBe("集中できない");
      expect(mockedWriteData).toHaveBeenCalledOnce();
    });

    it("存在しないIDでエラーをスローする", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });

      await expect(updateItem("nonexistent", { title: "新タイトル" })).rejects.toThrow(
        "アイテムが見つかりません: nonexistent",
      );
      expect(mockedWriteData).not.toHaveBeenCalled();
    });

    it("completedAt を設定できる", async () => {
      mockedReadData.mockResolvedValue({ items: [{ ...baseItem }], reviews: [] });

      const result = await updateItem("abc", { completedAt: "2026-03-01T00:00:00.000Z" });

      expect(result.completedAt).toBe("2026-03-01T00:00:00.000Z");
      expect(mockedWriteData).toHaveBeenCalledOnce();
    });

    it("completedAt を null でクリアできる", async () => {
      mockedReadData.mockResolvedValue({
        items: [{ ...baseItem, completedAt: "2026-03-01T00:00:00.000Z" }],
        reviews: [],
      });

      const result = await updateItem("abc", { completedAt: null });

      expect(result.completedAt).toBeUndefined();
    });
  });

  describe("retryItem", () => {
    it("currentAttempt が1増える", async () => {
      mockedReadData.mockResolvedValue({ items: [{ ...baseItem, currentAttempt: 2 }], reviews: [] });

      const result = await retryItem("abc");

      expect(result.currentAttempt).toBe(3);
      expect(mockedWriteData).toHaveBeenCalledOnce();
    });

    it("startDate が今日にリセットされる", async () => {
      mockedReadData.mockResolvedValue({ items: [{ ...baseItem }], reviews: [] });

      const today = new Date().toISOString().slice(0, 10);
      const result = await retryItem("abc");

      expect(result.startDate).toBe(today);
    });
  });

  describe("deleteItem", () => {
    it("アイテムと関連レビューが削除される", async () => {
      const store: NotToDoData = {
        items: [{ ...baseItem }],
        reviews: [
          {
            id: "r1",
            itemId: "abc",
            adherence: "kept",
            reflection: "よかった",
            reviewedAt: "2026-01-02T00:00:00.000Z",
            attemptNumber: 1,
          },
          {
            id: "r2",
            itemId: "other",
            adherence: "broke",
            reflection: "だめだった",
            reviewedAt: "2026-01-02T00:00:00.000Z",
            attemptNumber: 1,
          },
        ],
      };
      mockedReadData.mockResolvedValue({ ...store, items: [...store.items], reviews: [...store.reviews] });

      let written: NotToDoData | undefined;
      mockedWriteData.mockImplementation(async (data: NotToDoData) => {
        written = data;
      });

      await deleteItem("abc");

      expect(written!.items).toHaveLength(0);
      expect(written!.reviews).toHaveLength(1);
      expect(written!.reviews[0]!.itemId).toBe("other");
    });

    it("存在しないIDでエラーをスローする", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });

      await expect(deleteItem("nonexistent")).rejects.toThrow(
        "アイテムが見つかりません: nonexistent"
      );
      expect(mockedWriteData).not.toHaveBeenCalled();
    });
  });
});
