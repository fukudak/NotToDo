import { calcElapsedDays } from "./dates";
import type { ItemProgress, ItemStatus, NotToDoItem, ReviewRecord } from "../types";

const DEFAULT_TARGET_DAYS = 66;

export function getItemStartDate(item: NotToDoItem): string {
  return item.startDate ?? item.createdAt.slice(0, 10);
}

export function getCurrentAttempt(item: NotToDoItem): number {
  return item.currentAttempt ?? 1;
}

export function getTargetDays(item: NotToDoItem): number {
  return item.targetDays ?? DEFAULT_TARGET_DAYS;
}

/** 現在の試みに属するレビューを返す */
export function reviewsForCurrentAttempt(item: NotToDoItem, reviews: ReviewRecord[]): ReviewRecord[] {
  const attempt = getCurrentAttempt(item);
  return reviews.filter(
    (review) => review.itemId === item.id && (review.attemptNumber ?? 1) === attempt,
  );
}

/** アイテムの進捗情報を計算する */
export function calcItemProgress(item: NotToDoItem, reviews: ReviewRecord[]): ItemProgress {
  const startDate = getItemStartDate(item);
  const elapsedDays = calcElapsedDays(startDate);
  const currentAttemptReviews = reviewsForCurrentAttempt(item, reviews);
  const hasBroke = currentAttemptReviews.some((review) => review.adherence === "broke");

  let status: ItemStatus;
  if (hasBroke) {
    status = "failed";
  } else if (elapsedDays >= getTargetDays(item)) {
    status = "achieved";
  } else {
    status = "ongoing";
  }

  return { elapsedDays, status, currentAttemptReviews, hasBroke };
}

/** 進捗率（0–100）を返す */
export function calcProgressPercent(item: NotToDoItem, elapsedDays: number): number {
  return Math.min(100, Math.round((elapsedDays / getTargetDays(item)) * 100));
}

/** 進捗率から3段階のステージクラスを返す（ongoing のみ） */
export function progressStageClass(percent: number, status: ItemStatus): string {
  if (status !== "ongoing") return "";
  if (percent >= 67) return "progress-stage-3";
  if (percent >= 34) return "progress-stage-2";
  return "progress-stage-1";
}

/** 試み番号の表示ラベル */
export function attemptLabel(attempt: number): string {
  return attempt > 1 ? `${attempt}回目の挑戦` : "";
}

/** エクスポート用の状態ラベル */
export function statusLabel(status: ItemStatus): string {
  if (status === "failed") return "失敗";
  if (status === "achieved") return "習慣化達成";
  return "継続中";
}
