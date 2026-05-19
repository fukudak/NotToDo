import { describe, expect, it } from "vitest";
import { mergeBackupData, parseBackupFile } from "../../src/lib/importMarkdown";

const validBackup = {
  version: "1.0",
  exportedAt: "2026-05-19T00:00:00.000Z",
  items: [
    {
      id: "item-1",
      title: "SNSを見ない",
      reason: "時間の無駄",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      startDate: "2026-01-01",
      targetDays: 66,
      currentAttempt: 1,
    },
  ],
  reviews: [
    {
      id: "rev-1",
      itemId: "item-1",
      adherence: "kept" as const,
      reflection: "頑張れた",
      reviewedAt: "2026-05-01T00:00:00.000Z",
      attemptNumber: 1,
    },
  ],
};

const makeMd = (json: unknown) =>
  `# バックアップ\n<!--BACKUP_DATA\n${JSON.stringify(json, null, 2)}\n-->\n`;

describe("parseBackupFile", () => {
  describe(".md ファイル", () => {
    it("BACKUP_DATA コメント内の JSON を抽出してパースできる", () => {
      const md = makeMd(validBackup);
      const result = parseBackupFile(md, "backup.md");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("SNSを見ない");
      expect(result.reviews).toHaveLength(1);
    });

    it("BACKUP_DATA コメントがない場合はエラーを投げる", () => {
      expect(() => parseBackupFile("# バックアップ\n本文のみ", "backup.md")).toThrow(
        "バックアップデータが見つかりません",
      );
    });
  });

  describe(".json ファイル", () => {
    it("items と reviews を持つ JSON をパースできる", () => {
      const json = JSON.stringify(validBackup);
      const result = parseBackupFile(json, "backup.json");
      expect(result.items).toHaveLength(1);
      expect(result.reviews).toHaveLength(1);
    });

    it("items フィールドがない場合はエラーを投げる", () => {
      const json = JSON.stringify({ reviews: [] });
      expect(() => parseBackupFile(json, "backup.json")).toThrow(
        "有効なバックアップJSONではありません",
      );
    });

    it("reviews フィールドがない場合はエラーを投げる", () => {
      const json = JSON.stringify({ items: [] });
      expect(() => parseBackupFile(json, "backup.json")).toThrow(
        "有効なバックアップJSONではありません",
      );
    });
  });

  describe("拡張子不明のファイル", () => {
    it("Markdown 形式なら成功する", () => {
      const md = makeMd(validBackup);
      const result = parseBackupFile(md, "backup");
      expect(result.items).toHaveLength(1);
    });

    it("Markdown が失敗したら JSON にフォールバックする", () => {
      const json = JSON.stringify(validBackup);
      const result = parseBackupFile(json, "backup");
      expect(result.items).toHaveLength(1);
    });

    it("どちらでもない場合はエラーを投げる", () => {
      expect(() => parseBackupFile("not valid content", "backup")).toThrow();
    });
  });
});

describe("mergeBackupData", () => {
  it("同一 ID のアイテムは上書きされる", () => {
    const existing = [{ ...validBackup.items[0], title: "旧タイトル" }];
    const imported = { ...validBackup, items: [{ ...validBackup.items[0], title: "新タイトル" }] };
    const { items } = mergeBackupData(existing, [], imported);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("新タイトル");
  });

  it("新規 ID のアイテムは追加される", () => {
    const newItem = { ...validBackup.items[0], id: "item-2", title: "夜更かしをしない" };
    const imported = { ...validBackup, items: [newItem] };
    const { items } = mergeBackupData(validBackup.items, [], imported);
    expect(items).toHaveLength(2);
  });

  it("同一 ID のレビューは上書きされる", () => {
    const existing = [{ ...validBackup.reviews[0], reflection: "旧コメント" }];
    const imported = {
      ...validBackup,
      items: [],
      reviews: [{ ...validBackup.reviews[0], reflection: "新コメント" }],
    };
    const { reviews } = mergeBackupData([], existing, imported);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].reflection).toBe("新コメント");
  });

  it("新規 ID のレビューは追加される", () => {
    const newReview = { ...validBackup.reviews[0], id: "rev-2" };
    const imported = { ...validBackup, items: [], reviews: [newReview] };
    const { reviews } = mergeBackupData([], validBackup.reviews, imported);
    expect(reviews).toHaveLength(2);
  });

  it("既存データが空の場合はインポートデータがそのまま返る", () => {
    const { items, reviews } = mergeBackupData([], [], validBackup);
    expect(items).toHaveLength(1);
    expect(reviews).toHaveLength(1);
  });
});
