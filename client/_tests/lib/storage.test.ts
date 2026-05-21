import { beforeEach, describe, expect, it } from "vitest";
import * as storage from "../../src/lib/storage";

// 各テスト前にlocalStorageをクリア（setup.tsのafterEachでも行われる）
beforeEach(() => {
  localStorage.clear();
});

describe("storage - アイテム操作", () => {
  it("初期状態で空配列を返す", () => {
    expect(storage.getItems()).toEqual([]);
  });

  it("addItemでアイテムを追加できる", () => {
    const item = storage.addItem("SNSを見ない", "時間の無駄", "2026-01-01", 66, "userA");
    expect(item.id).toBeTruthy();
    expect(item.title).toBe("SNSを見ない");
    expect(item.reason).toBe("時間の無駄");
    expect(item.startDate).toBe("2026-01-01");
    expect(item.targetDays).toBe(66);
    expect(item.currentAttempt).toBe(1);
    expect(item.userId).toBe("userA");
    expect(item.createdAt).toBeTruthy();
    expect(item.updatedAt).toBeTruthy();
  });

  it("addItemで追加したアイテムがgetItemsで取得できる", () => {
    storage.addItem("テスト", "理由", "2026-01-01", 66);
    const items = storage.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("テスト");
  });

  it("userIdなしでaddItemできる", () => {
    const item = storage.addItem("タイトル", "理由", "2026-01-01", 30);
    expect(item.userId).toBeUndefined();
  });

  it("updateItemでアイテムを更新できる", () => {
    const item = storage.addItem("元のタイトル", "元の理由", "2026-01-01", 66);
    const updated = storage.updateItem(item.id, { title: "新しいタイトル" });
    expect(updated.title).toBe("新しいタイトル");
    expect(updated.reason).toBe("元の理由");
    expect(updated.updatedAt).not.toBe(item.updatedAt);
  });

  it("updateItemで存在しないIDはエラーになる", () => {
    expect(() => storage.updateItem("nonexistent", { title: "x" })).toThrow();
  });

  it("deleteItemでアイテムを削除できる", () => {
    const item = storage.addItem("削除対象", "理由", "2026-01-01", 66);
    storage.deleteItem(item.id);
    expect(storage.getItems()).toHaveLength(0);
  });

  it("deleteItemで関連レビューも削除される", () => {
    const item = storage.addItem("削除対象", "理由", "2026-01-01", 66);
    storage.addReview(item.id, "kept", "振り返り");
    expect(storage.getReviews()).toHaveLength(1);
    storage.deleteItem(item.id);
    expect(storage.getReviews()).toHaveLength(0);
  });
});

describe("storage - レビュー操作", () => {
  it("初期状態で空配列を返す", () => {
    expect(storage.getReviews()).toEqual([]);
  });

  it("addReviewでレビューを追加できる", () => {
    const item = storage.addItem("テスト", "理由", "2026-01-01", 66);
    const review = storage.addReview(item.id, "kept", "良かった", "userA");
    expect(review.id).toBeTruthy();
    expect(review.itemId).toBe(item.id);
    expect(review.adherence).toBe("kept");
    expect(review.reflection).toBe("良かった");
    expect(review.userId).toBe("userA");
    expect(review.reviewedAt).toBeTruthy();
  });

  it("addReviewでattemptNumberがアイテムのcurrentAttemptと一致する", () => {
    const item = storage.addItem("テスト", "理由", "2026-01-01", 66);
    storage.updateItem(item.id, { currentAttempt: 3 });
    const review = storage.addReview(item.id, "broke", "失敗");
    expect(review.attemptNumber).toBe(3);
  });

  it("addReviewでアイテムが存在しない場合はattemptNumber=1になる", () => {
    const review = storage.addReview("nonexistent", "kept", "振り返り");
    expect(review.attemptNumber).toBe(1);
  });
});

describe("storage - サマリー計算", () => {
  it("空のレビュー配列からは空のサマリーが返る", () => {
    expect(storage.computeSummary([])).toEqual([]);
  });

  it("複数レビューからサマリーを正しく集計する", () => {
    const reviews = [
      { id: "r1", itemId: "i1", adherence: "kept" as const, reflection: "", reviewedAt: "", attemptNumber: 1 },
      { id: "r2", itemId: "i1", adherence: "broke" as const, reflection: "", reviewedAt: "", attemptNumber: 1 },
      { id: "r3", itemId: "i1", adherence: "kept" as const, reflection: "", reviewedAt: "", attemptNumber: 1 },
      { id: "r4", itemId: "i2", adherence: "kept" as const, reflection: "", reviewedAt: "", attemptNumber: 1 },
    ];
    const summary = storage.computeSummary(reviews);
    const s1 = summary.find((s) => s.itemId === "i1");
    expect(s1?.totalReviews).toBe(3);
    expect(s1?.keptCount).toBe(2);
    expect(s1?.brokeCount).toBe(1);
    const s2 = summary.find((s) => s.itemId === "i2");
    expect(s2?.totalReviews).toBe(1);
    expect(s2?.keptCount).toBe(1);
  });
});

describe("storage - プラン操作", () => {
  it("未設定の場合はデフォルトプランを返す（free / 3件）", () => {
    const plan = storage.getPlan("userA");
    expect(plan.plan).toBe("free");
    expect(plan.maxItems).toBe(3);
    expect(plan.userId).toBe("userA");
  });

  it("setPlanでプランを保存してgetPlanで取得できる", () => {
    storage.setPlan("userA", "pro", 9999);
    const plan = storage.getPlan("userA");
    expect(plan.plan).toBe("pro");
    expect(plan.maxItems).toBe(9999);
  });

  it("ユーザーごとに別々のプランが保存される", () => {
    storage.setPlan("userA", "pro", 9999);
    storage.setPlan("userB", "free", 3);
    expect(storage.getPlan("userA").plan).toBe("pro");
    expect(storage.getPlan("userB").plan).toBe("free");
  });
});

describe("storage - エクスポート/インポート", () => {
  it("exportAllでJSON文字列が返る", () => {
    storage.addItem("テスト", "理由", "2026-01-01", 66);
    const json = storage.exportAll();
    const data = JSON.parse(json) as { version: string; items: unknown[]; reviews: unknown[] };
    expect(data.version).toBe("1.0");
    expect(data.items).toHaveLength(1);
    expect(data.reviews).toHaveLength(0);
  });

  it("importAllでアイテムとレビューが追加される", () => {
    const json = JSON.stringify({
      items: [
        { id: "i1", title: "a", reason: "r", createdAt: "", updatedAt: "", startDate: "2026-01-01", targetDays: 66, currentAttempt: 1 },
      ],
      reviews: [
        { id: "rv1", itemId: "i1", adherence: "kept", reflection: "", reviewedAt: "", attemptNumber: 1 },
      ],
    });
    const result = storage.importAll(json);
    expect(result.importedItems).toBe(1);
    expect(result.importedReviews).toBe(1);
    expect(storage.getItems()).toHaveLength(1);
    expect(storage.getReviews()).toHaveLength(1);
  });

  it("importAllでID重複の場合は上書きされる", () => {
    storage.addItem("元のタイトル", "理由", "2026-01-01", 66);
    const existingId = storage.getItems()[0].id;

    const json = JSON.stringify({
      items: [
        { id: existingId, title: "上書きタイトル", reason: "r", createdAt: "", updatedAt: "", startDate: "2026-01-01", targetDays: 66, currentAttempt: 1 },
      ],
      reviews: [],
    });
    storage.importAll(json);
    const items = storage.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("上書きタイトル");
  });

  it("importAllで既存データとマージされる", () => {
    storage.addItem("既存", "理由", "2026-01-01", 66);
    const json = JSON.stringify({
      items: [
        { id: "new-id", title: "新規", reason: "r", createdAt: "", updatedAt: "", startDate: "2026-01-01", targetDays: 66, currentAttempt: 1 },
      ],
      reviews: [],
    });
    storage.importAll(json);
    expect(storage.getItems()).toHaveLength(2);
  });
});
