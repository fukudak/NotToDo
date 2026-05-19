import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotToDoData } from "../domain/types.ts";

vi.mock("../infrastructure/dataRepository.ts", () => ({
  readData: vi.fn(),
  writeData: vi.fn(),
}));

import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { addReview, getAdherenceSummary, getReviews } from "../domain/reviewService.ts";

const mockedReadData = vi.mocked(readData);
const mockedWriteData = vi.mocked(writeData);

const baseItem = {
  id: "item1",
  title: "SNSを見ない",
  reason: "時間の無駄",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  targetDays: 66,
  currentAttempt: 1,
};

const baseReview = {
  id: "r1",
  itemId: "item1",
  adherence: "kept" as const,
  reflection: "よかった",
  reviewedAt: "2026-01-02T00:00:00.000Z",
  attemptNumber: 1,
};

describe("reviewService", () => {
  beforeEach(() => {
    mockedReadData.mockReset();
    mockedWriteData.mockReset();
    mockedWriteData.mockResolvedValue(undefined);
  });

  describe("getReviews", () => {
    it("全件取得できる", async () => {
      const store: NotToDoData = {
        items: [{ ...baseItem }],
        reviews: [
          { ...baseReview },
          { ...baseReview, id: "r2", itemId: "item2", adherence: "broke" },
        ],
      };
      mockedReadData.mockResolvedValue(store);

      const reviews = await getReviews();

      expect(reviews).toHaveLength(2);
    });

    it("itemId でフィルタできる", async () => {
      const store: NotToDoData = {
        items: [{ ...baseItem }],
        reviews: [
          { ...baseReview },
          { ...baseReview, id: "r2", itemId: "item2", adherence: "broke" },
        ],
      };
      mockedReadData.mockResolvedValue(store);

      const reviews = await getReviews("item1");

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.itemId).toBe("item1");
    });
  });

  describe("addReview", () => {
    it("正常系: レビューを追加できる", async () => {
      mockedReadData.mockResolvedValue({ items: [{ ...baseItem }], reviews: [] });

      const result = await addReview({
        itemId: "item1",
        adherence: "kept",
        reflection: "よかった",
      });

      expect(result.id).toBeTruthy();
      expect(result.itemId).toBe("item1");
      expect(result.adherence).toBe("kept");
      expect(result.reflection).toBe("よかった");
      expect(result.attemptNumber).toBe(1);
      expect(mockedWriteData).toHaveBeenCalledOnce();
    });

    it("存在しないアイテムIDでエラーをスローする", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });

      await expect(
        addReview({ itemId: "nonexistent", adherence: "kept", reflection: "テスト" })
      ).rejects.toThrow("アイテムが見つかりません: nonexistent");
      expect(mockedWriteData).not.toHaveBeenCalled();
    });
  });

  describe("getAdherenceSummary", () => {
    it("アイテムもレビューもない場合は空配列を返す", async () => {
      mockedReadData.mockResolvedValue({ items: [], reviews: [] });

      const summary = await getAdherenceSummary();

      expect(summary).toEqual([]);
    });

    it("kept と broke のカウントを正しく集計する", async () => {
      const store: NotToDoData = {
        items: [{ ...baseItem }],
        reviews: [
          { ...baseReview, id: "r1", adherence: "kept" },
          { ...baseReview, id: "r2", adherence: "kept" },
          { ...baseReview, id: "r3", adherence: "broke" },
        ],
      };
      mockedReadData.mockResolvedValue(store);

      const summary = await getAdherenceSummary();

      expect(summary).toHaveLength(1);
      const s = summary[0]!;
      expect(s.itemId).toBe("item1");
      expect(s.totalReviews).toBe(3);
      expect(s.keptCount).toBe(2);
      expect(s.brokeCount).toBe(1);
    });
  });
});
