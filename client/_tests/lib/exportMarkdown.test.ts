import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { generateMarkdown, downloadMarkdown } from "../../src/lib/exportMarkdown";
import type { NotToDoItem, ReviewRecord } from "../../src/types";

// ─── テストデータ ───

const baseItem: NotToDoItem = {
  id: "item-1",
  title: "深夜のSNS閲覧",
  reason: "睡眠の質が下がるため",
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
  startDate: "2026-05-01",
  targetDays: 66,
  currentAttempt: 1,
};

const baseReview: ReviewRecord = {
  id: "review-1",
  itemId: "item-1",
  adherence: "kept",
  reflection: "今日は守れた。とても良い調子。",
  reviewedAt: "2026-05-19T12:00:00.000Z",
  attemptNumber: 1,
};

const multiAttemptItem: NotToDoItem = {
  ...baseItem,
  id: "item-2",
  title: "甘いもの断ち",
  currentAttempt: 2,
  startDate: "2026-05-15",
  targetDays: 21,
};

// attemptNumber=2 のレビュー（multiAttemptItem の currentAttempt=2 と一致する）
const attempt2Review: ReviewRecord = {
  ...baseReview,
  id: "review-a2",
  itemId: "item-2",
  attemptNumber: 2,
  reviewedAt: "2026-05-20T12:00:00.000Z",
  reflection: "2回目は順調",
};

// ─── generateMarkdown ───

describe("generateMarkdown", () => {
  it("アイテム0件のとき「まだアイテムがありません」が表示される", () => {
    const md = generateMarkdown([], []);
    expect(md).toContain("_まだアイテムがありません。_");
    expect(md).not.toContain("## ");
  });

  it("アイテム1件で基本情報行が出力される", () => {
    const md = generateMarkdown([baseItem], []);
    expect(md).toContain("## 深夜のSNS閲覧");
    expect(md).toContain("**理由**: 睡眠の質が下がるため");
    expect(md).toContain("**開始日**: 2026/05/01");
    expect(md).toContain("**目標**: 66日");
    expect(md).toContain("**進捗**:");
    expect(md).toContain("**状態**:");
  });

  it("BACKUP_DATA コメントが末尾に埋め込まれる", () => {
    const md = generateMarkdown([baseItem], [baseReview]);
    expect(md).toContain("<!--BACKUP_DATA");
    expect(md).toContain(`"version": "1.0"`);
    expect(md).toContain(`"exportedAt":`);
    expect(md).toContain(`"items":`);
    expect(md).toContain(`"reviews":`);
    expect(md).toContain("-->");
  });

  it("BACKUP_DATA 内のJSONがそのままJSON.parseで復元できる", () => {
    const md = generateMarkdown([baseItem], [baseReview]);
    const match = md.match(/<!--BACKUP_DATA\n([\s\S]*?)\n-->/);
    expect(match?.[1]).toBeTruthy();
    const parsed = JSON.parse(match![1]);
    expect(parsed.version).toBe("1.0");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.reviews).toHaveLength(1);
    expect(parsed.items[0].id).toBe("item-1");
  });

  it("レビューコメント中の | が全角 ｜ にエスケープされる", () => {
    const reviewWithPipe: ReviewRecord = {
      ...baseReview,
      reflection: "A|B の選択で迷った",
    };
    const md = generateMarkdown([baseItem], [reviewWithPipe]);
    expect(md).toContain("A｜B");
    expect(md).not.toContain("| A|B |");
  });

  it(
    "attemptNumber が currentAttempt と一致するレビューのみ履歴に表示される（attemptNumber=2 のレビューを渡す）",
    () => {
      // multiAttemptItem は currentAttempt=2 。attemptNumber=2 のレビューのみ履歴に出る
      const md = generateMarkdown([multiAttemptItem], [attempt2Review]);
      expect(md).toContain("振り返り履歴（第2回目の挑戦）");
      // attempt2Review の内容 "2回目は順調" は含まれる
      expect(md).toContain("2回目は順調");
    },
  );

  it("currentAttempt > 1 のとき「N回目」が表示される", () => {
    const md = generateMarkdown([multiAttemptItem], []);
    expect(md).toContain("**試み**: 2回目");
  });

  it("failed 状態の時は「失敗」と表示される", () => {
    const failedReview: ReviewRecord = {
      ...baseReview,
      id: "review-fail",
      adherence: "broke",
      reflection: "失敗した",
    };
    const md = generateMarkdown([baseItem], [failedReview]);
    // renderItemMarkdown 内の status は文字列として直接埋め込まれる
    expect(md).toContain("**状態**: 失敗  ");
  });

  it("achieved 状態の時は「習慣化達成」と表示される", () => {
    const achievedItem: NotToDoItem = {
      ...baseItem,
      startDate: "2024-01-01",
    };
    const md = generateMarkdown([achievedItem], []);
    expect(md).toContain("**状態**: 習慣化達成  ");
  });
});

// ─── downloadMarkdown ───

describe("downloadMarkdown", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // jsdom では document.createElement("a").click() が即時実行されるので
  // エラーが出なければ成功とみなすスモークテスト
  it("呼び出しでエラーが出ない", () => {
    expect(() => downloadMarkdown("# test\n", "test.md")).not.toThrow();
  });

  it("createObjectURL が Blob 生成で呼ばれる", () => {
    const spy = vi.spyOn(URL, "createObjectURL" as any);
    downloadMarkdown("# test\n", "test.md");
    // jsdom では a.click() によるナビゲーションが発生しないため
    // URL.revokeObjectURL は呼ばれず createObjectURL は1回だけ
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
