import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemCard } from "../../src/components/ItemCard";
import type { AdherenceSummary, NotToDoItem, ReviewRecord } from "../../src/types";

// ─── ヘルパー ───

function withFixedDate(isoDate: string, fn: () => void) {
  vi.setSystemTime(new Date(isoDate));
  try { fn(); } finally { vi.useRealTimers(); }
}

function baseItem(overrides: Partial<NotToDoItem> = {}): NotToDoItem {
  return {
    id: "item-1",
    title: "深夜のSNS閲覧",
    reason: "睡眠の質が下がるため",
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
    startDate: "2026-05-01",
    targetDays: 66,
    currentAttempt: 1,
    ...overrides,
  };
}

const noSummary: AdherenceSummary | undefined = undefined;
const noReviews: ReviewRecord[] = [];

const onDelete = vi.fn().mockResolvedValue(undefined);
const onRetry = vi.fn().mockResolvedValue(undefined);
beforeEach(() => vi.clearAllMocks());

// ─── ItemCard ───

describe("ItemCard", () => {
  // ── ongoing ──

  describe("状態: ongoing（継続中）", () => {
    it("開始から目標に満たないとき ongoing", () => {
      withFixedDate("2026-05-19", () => {
        // startDate=2026-05-01, targetDays=66 → elapsed=18, 27%
        render(
          <ItemCard
            item={baseItem({ startDate: "2026-05-01", targetDays: 66 })}
            summary={noSummary}
            reviews={noReviews}
            onDelete={onDelete}
            onRetry={onRetry}
          />,
        );
        expect(screen.getByText("あと48日")).toBeInTheDocument();
        // テキストは複数ノードに分割される
        expect(screen.getByText(/18 \s*\/\s* 66日/)).toBeInTheDocument();
      });
    });
  });

  // ── failed ──

  describe("状態: failed（失敗）", () => {
    it("broke レビューがあると失敗状態になる", () => {
      const broke: ReviewRecord = {
        id: "r1", itemId: "item-1", adherence: "broke",
        reflection: "つい見てしまった", reviewedAt: "2026-05-18T10:00:00.000Z", attemptNumber: 1,
      };
      render(
        <ItemCard item={baseItem()} summary={noSummary} reviews={[broke]}
          onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("今回の試みは失敗")).toBeInTheDocument();
      // 実装は「破ってしまいましたが」（「破いて」ではない）
      expect(screen.getByText(/破ってしまいましたが/)).toBeInTheDocument();
      expect(screen.getByText(/諦めないで/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "リトライする" })).toBeInTheDocument();
    });

    it("attempt badge は failed 時も currentAttempt > 1 なら表示される", () => {
      // 実装: attempt badge は status によらず currentAttempt > 1 で表示
      const broke: ReviewRecord = {
        id: "r1", itemId: "item-1", adherence: "broke",
        reflection: "失敗", reviewedAt: "2026-05-18T10:00:00.000Z", attemptNumber: 1,
      };
      render(
        <ItemCard item={baseItem({ currentAttempt: 2 })} summary={noSummary} reviews={[broke]}
          onDelete={onDelete} onRetry={onRetry} />,
      );
      // failed 時でも attempt badge は表示される
      expect(screen.getByText("2回目の挑戦")).toBeInTheDocument();
    });

    it("リトライボタンクリックで onRetry が呼ばれる", async () => {
      const user = userEvent.setup();
      const broke: ReviewRecord = {
        id: "r1", itemId: "item-1", adherence: "broke",
        reflection: "失敗", reviewedAt: "2026-05-18T10:00:00.000Z", attemptNumber: 1,
      };
      render(
        <ItemCard item={baseItem()} summary={noSummary} reviews={[broke]}
          onDelete={onDelete} onRetry={onRetry} />,
      );
      await user.click(screen.getByRole("button", { name: "リトライする" }));
      expect(onRetry).toHaveBeenCalledWith("item-1");
    });
  });

  // ── achieved ──

  describe("状態: achieved（達成）", () => {
    it("目標日数を超えると達成状態になる（バッジ表示）", () => {
      withFixedDate("2026-09-10", () => {
        render(
          <ItemCard item={baseItem({ startDate: "2026-01-01", targetDays: 66 })}
            summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
        );
        // 実装: achieved 時は達成バッジ（★習慣化達成！N日間継続）のみを表示
        // 「達成済み」progressLabel は progress-section ごと非表示のためDOMに出ない
        const badgeIcon = screen.getByText("★");
        expect(badgeIcon).toBeInTheDocument();
        expect(screen.getByText(/66日間継続/)).toBeInTheDocument();
        // status クラスが付与されている
        const card = badgeIcon.closest(".item-card")!;
        expect(card).toHaveClass("status-achieved");
      });
    });

    it("targetDays=90 のとき正しく表示される", () => {
      withFixedDate("2026-09-10", () => {
        render(
          <ItemCard item={baseItem({ startDate: "2026-01-01", targetDays: 90 })}
            summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
        );
        expect(screen.getByText(/90日間継続/)).toBeInTheDocument();
      });
    });
  });

  // ── 進捗バー・ステージ ──

  describe("進捗バー", () => {
    it("0% のとき stage-1", () => {
      withFixedDate("2026-05-01", () => {
        render(
          <ItemCard item={baseItem({ startDate: "2026-05-01" })}
            summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
        );
        const card = screen.getByText("あと66日").closest(".item-card")!;
        expect(card).toHaveClass("progress-stage-1");
      });
    });

    it("50% のとき stage-2", () => {
      withFixedDate("2026-06-06", () => {
        render(
          <ItemCard item={baseItem({ startDate: "2026-05-01", targetDays: 66 })}
            summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
        );
        expect(screen.getByText("55%")).toBeInTheDocument();
        const card = screen.getByText("あと30日").closest(".item-card")!;
        expect(card).toHaveClass("progress-stage-2");
      });
    });
  });

  // ── 試み番号 ──

  describe("試み番号", () => {
    it("currentAttempt=1 のときバッジなし", () => {
      render(
        <ItemCard item={baseItem({ currentAttempt: 1 })}
          summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.queryByText("1回目の挑戦")).not.toBeInTheDocument();
    });

    it("currentAttempt=2 のとき「2回目の挑戦」", () => {
      render(
        <ItemCard item={baseItem({ currentAttempt: 2 })}
          summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("2回目の挑戦")).toBeInTheDocument();
    });

    it("currentAttempt=3 のとき「3回目の挑戦」", () => {
      render(
        <ItemCard item={baseItem({ currentAttempt: 3 })}
          summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("3回目の挑戦")).toBeInTheDocument();
    });
  });

  // ── フッター ──

  describe("フッター情報", () => {
    it("レビューあり → 振り返り回数・最終日が表示される", () => {
      const review: ReviewRecord = {
        id: "r1", itemId: "item-1", adherence: "kept",
        reflection: "守った", reviewedAt: "2026-05-19T10:00:00.000Z", attemptNumber: 1,
      };
      render(
        <ItemCard item={baseItem()}
          summary={{ itemId: "item-1", totalReviews: 1, keptCount: 1, brokeCount: 0 }}
          reviews={[review]} onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("振り返り 1回")).toBeInTheDocument();
      expect(screen.getByText(/最終:/)).toBeInTheDocument();
    });

    it("レビューなし → 「未レビュー」", () => {
      render(
        <ItemCard item={baseItem()} summary={noSummary} reviews={noReviews}
          onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("未レビュー")).toBeInTheDocument();
    });

    it("開始日が表示される", () => {
      render(
        <ItemCard item={baseItem({ startDate: "2026-05-01" })}
          summary={noSummary} reviews={noReviews} onDelete={onDelete} onRetry={onRetry} />,
      );
      expect(screen.getByText("開始: 2026/05/01")).toBeInTheDocument();
    });
  });

  // ── 削除 ──

  it("削除ボタンクリックで onDelete が呼ばれる", async () => {
    const user = userEvent.setup();
    render(
      <ItemCard item={baseItem()} summary={noSummary} reviews={noReviews}
        onDelete={onDelete} onRetry={onRetry} />,
    );
    await user.click(screen.getByRole("button", { name: "深夜のSNS閲覧を削除" }));
    expect(onDelete).toHaveBeenCalledWith("item-1");
  });

  // ── attemptNumber 不一致は failed 判定に影響しない ──

  it("currentAttempt=2 で attemptNumber=1 のレビューは無視（failed にならない）", () => {
    const oldReview: ReviewRecord = {
      id: "r1", itemId: "item-1", adherence: "broke",
      reflection: "過去の失敗", reviewedAt: "2026-05-10T10:00:00.000Z", attemptNumber: 1,
    };
    render(
      <ItemCard item={baseItem({ currentAttempt: 2, startDate: "2026-05-15" })}
        summary={noSummary} reviews={[oldReview]} onDelete={onDelete} onRetry={onRetry} />,
    );
    expect(screen.queryByText("今回の試みは失敗")).not.toBeInTheDocument();
  });
});
