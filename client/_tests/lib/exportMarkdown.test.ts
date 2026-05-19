import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadMarkdown, generateMarkdown } from "../../src/lib/exportMarkdown";
import type { NotToDoItem, ReviewRecord } from "../../src/types";

const baseItem: NotToDoItem = {
  id: "item-1",
  title: "SNSを見ない",
  reason: "時間の無駄",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  targetDays: 66,
  currentAttempt: 1,
};

const baseReview: ReviewRecord = {
  id: "rev-1",
  itemId: "item-1",
  adherence: "kept",
  reflection: "頑張れた",
  reviewedAt: "2026-05-01T00:00:00.000Z",
  attemptNumber: 1,
};

describe("generateMarkdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("アイテムが0件のとき「まだアイテムがありません」行が含まれる", () => {
    const md = generateMarkdown([], []);
    expect(md).toContain("_まだアイテムがありません。_");
  });

  it("1件のとき ## {title} / **理由** / **進捗** 行が含まれる", () => {
    const md = generateMarkdown([baseItem], []);
    expect(md).toContain("## SNSを見ない");
    expect(md).toContain("**理由**: 時間の無駄");
    expect(md).toContain("**進捗**:");
  });

  it("BACKUP_DATA コメントが末尾に埋め込まれ JSON として復元できる", () => {
    const md = generateMarkdown([baseItem], [baseReview]);
    const match = md.match(/<!--BACKUP_DATA\n([\s\S]*?)\n-->/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![1]);
    expect(parsed).toMatchObject({
      version: "1.0",
      items: expect.any(Array),
      reviews: expect.any(Array),
    });
    expect(parsed.items[0].id).toBe("item-1");
    expect(parsed.reviews[0].id).toBe("rev-1");
  });

  it("レビューコメント中の | が全角 ｜ にエスケープされる", () => {
    const reviewWithPipe: ReviewRecord = {
      ...baseReview,
      reflection: "結果 | 感想",
    };
    const md = generateMarkdown([baseItem], [reviewWithPipe]);
    // BACKUP_DATA コメントは生 JSON なので人間が読む部分だけ検証する
    const humanPart = md.split("<!--BACKUP_DATA")[0];
    expect(humanPart).toContain("結果 ｜ 感想");
    expect(humanPart).not.toContain("結果 | 感想");
  });

  it("attemptNumber が currentAttempt と一致するレビューだけが履歴に出る", () => {
    const attempt2Item: NotToDoItem = { ...baseItem, currentAttempt: 2 };
    const attempt1Review: ReviewRecord = { ...baseReview, attemptNumber: 1, reflection: "1回目" };
    const attempt2Review: ReviewRecord = {
      ...baseReview,
      id: "rev-2",
      attemptNumber: 2,
      reflection: "2回目",
    };
    const md = generateMarkdown([attempt2Item], [attempt1Review, attempt2Review]);
    // BACKUP_DATA コメントは全レビューを含む生 JSON なので人間が読む部分だけ検証する
    const humanPart = md.split("<!--BACKUP_DATA")[0];
    expect(humanPart).toContain("2回目");
    expect(humanPart).not.toContain("1回目");
  });

  it("broke レビューがあるとき状態が「失敗」になる", () => {
    const brokeReview: ReviewRecord = { ...baseReview, adherence: "broke" };
    const md = generateMarkdown([baseItem], [brokeReview]);
    expect(md).toContain("**状態**: 失敗");
  });

  it("経過日数が targetDays 以上でレビューなしのとき状態が「習慣化達成」になる", () => {
    const oldItem: NotToDoItem = { ...baseItem, startDate: "2025-01-01", targetDays: 66 };
    const md = generateMarkdown([oldItem], []);
    expect(md).toContain("**状態**: 習慣化達成");
  });
});

describe("downloadMarkdown", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn(() => "blob:mock");
    mockRevokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
    mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag) as HTMLElement;
      if (tag === "a") {
        el.click = mockClick;
      }
      return el;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("エラーなく実行でき、URL.createObjectURL と a.click が呼ばれる", () => {
    downloadMarkdown("# test", "backup.md");
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
