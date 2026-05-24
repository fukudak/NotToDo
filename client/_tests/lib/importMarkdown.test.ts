import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { parseBackupFile, mergeBackupData } from "../../src/lib/importMarkdown";
import type { NotToDoItem, ReviewRecord } from "../../src/types";

// ─── テストデータ ───

const sampleItem: NotToDoItem = {
  id: "item-1",
  title: "深夜のSNS閲覧",
  reason: "睡眠の質が下がる",
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
  startDate: "2026-05-01",
  targetDays: 66,
  currentAttempt: 1,
};

const sampleReview: ReviewRecord = {
  id: "review-1",
  itemId: "item-1",
  adherence: "kept",
  reflection: "今日は守れた",
  reviewedAt: "2026-05-19T12:00:00.000Z",
  attemptNumber: 1,
};

const sampleBrokeReview: ReviewRecord = {
  ...sampleReview,
  id: "review-broke",
  adherence: "broke",
  reflection: "つい見てしまった",
};

// ─── parseBackupFile ───

describe("parseBackupFile", () => {
  // --- .md ファイル ---

  it("MarkdownファイルからBACKUP_DATA内のJSONを抽出できる", () => {
    const md = `# バックアップ\n\n<!--BACKUP_DATA\n{"version":"1.0","exportedAt":"2026-05-24T00:00:00.000Z","items":[],"reviews":[]}\n-->\n`;
    const result = parseBackupFile(md, "backup.md");
    expect(result.version).toBe("1.0");
    expect(result.items).toEqual([]);
    expect(result.reviews).toEqual([]);
  });

  it("MarkdownファイルにBACKUP_DATAコメントがない場合はエラーを投げる", () => {
    const md = "# ただのMarkdown\n\n本文だけ";
    expect(() => parseBackupFile(md, "backup.md")).toThrow(
      "バックアップデータが見つかりません",
    );
  });

  it("Markdownからitemsとreviewsを正しくパースできる", () => {
    const jsonPayload = JSON.stringify({
      version: "1.0",
      exportedAt: "2026-05-24T00:00:00.000Z",
      items: [sampleItem],
      reviews: [sampleReview],
    });
    const md = `<!--BACKUP_DATA\n${jsonPayload}\n-->`;
    const result = parseBackupFile(md, "test.md");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("item-1");
    expect(result.reviews).toHaveLength(1);
  });

  // --- .json ファイル ---

  it("JSONファイルからitemsとreviewsをパースできる", () => {
    const json = JSON.stringify({
      items: [sampleItem],
      reviews: [sampleReview],
    });
    const result = parseBackupFile(json, "backup.json");
    expect(result.items).toHaveLength(1);
    expect(result.reviews).toHaveLength(1);
  });

  it("JSONファイルでitemsが欠落している場合はエラーを投げる", () => {
    const json = JSON.stringify({ reviews: [sampleReview] });
    expect(() => parseBackupFile(json, "bad.json")).toThrow(
      "有効なバックアップJSONではありません",
    );
  });

  it("JSONファイルでreviewsが欠落している場合はエラーを投げる", () => {
    const json = JSON.stringify({ items: [sampleItem] });
    expect(() => parseBackupFile(json, "bad.json")).toThrow(
      "有効なバックアップJSONではありません",
    );
  });

  it("JSONファイルでitems/reviewsが配列でない場合はエラーを投げる", () => {
    const json = JSON.stringify({
      items: "not-an-array",
      reviews: [sampleReview],
    });
    expect(() => parseBackupFile(json, "bad.json")).toThrow(
      "有効なバックアップJSONではありません",
    );
  });

  // --- 拡張子不明 ---

  it("拡張子不明の場合はMarkdownを先に試し、失敗したらJSONにフォールバックする", () => {
    const json = JSON.stringify({ items: [sampleItem], reviews: [] });
    const result = parseBackupFile(json, "backup.unknown");
    expect(result.items).toHaveLength(1);
  });

  it("拡張子不明でMarkdownもJSONも失敗した場合は最後のJSONエラーが伝播する", () => {
    const plainText = "これはバックアップではありません";
    expect(() => parseBackupFile(plainText, "backup.unknown")).toThrow();
  });
});

// ─── mergeBackupData ───

describe("mergeBackupData", () => {
  const existingItems: NotToDoItem[] = [
    { ...sampleItem, id: "item-1", title: "古いタイトル" },
    { id: "item-2", title: "既存アイテム", reason: "理由" },
  ] as NotToDoItem[];
  const existingReviews: ReviewRecord[] = [sampleReview];

  it("同一IDのアイテムはインポート側で上書きされる", () => {
    const importedItems: NotToDoItem[] = [
      { ...sampleItem, id: "item-1", title: "新しいタイトル" },
    ];
    const importedReviews: ReviewRecord[] = [];
    const result = mergeBackupData(
      existingItems,
      existingReviews,
      { version: "1.0", exportedAt: "", items: importedItems, reviews: importedReviews },
    );
    const merged = result.items.find((i) => i.id === "item-1");
    expect(merged?.title).toBe("新しいタイトル");
  });

  it("新規IDのアイテムは追加される", () => {
    const importedItems: NotToDoItem[] = [
      { id: "item-new", title: "新規", reason: "新規理由" },
    ];
    const result = mergeBackupData(
      existingItems,
      existingReviews,
      { version: "1.0", exportedAt: "", items: importedItems, reviews: [] },
    );
    expect(result.items).toHaveLength(3);
    expect(result.items.map((i) => i.id).sort()).toEqual([
      "item-1",
      "item-2",
      "item-new",
    ]);
  });

  it("同一IDのレビューは上書きされる", () => {
    const importedReviews: ReviewRecord[] = [
      { ...sampleReview, id: "review-1", reflection: "更新後の振り返り" },
    ];
    const result = mergeBackupData(
      existingItems,
      existingReviews,
      { version: "1.0", exportedAt: "", items: [], reviews: importedReviews },
    );
    const merged = result.reviews.find((r) => r.id === "review-1");
    expect(merged?.reflection).toBe("更新後の振り返り");
  });

  it("itemsもreviewsも空の場合は既存データがそのまま返る", () => {
    const result = mergeBackupData(
      existingItems,
      existingReviews,
      { version: "1.0", exportedAt: "", items: [], reviews: [] },
    );
    expect(result.items).toHaveLength(2);
    expect(result.reviews).toHaveLength(1);
  });
});
