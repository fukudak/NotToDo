import { readData, writeData } from "../infrastructure/dataRepository.ts";
import type { AdherenceSummary, CreateReviewRequest, ReviewRecord } from "./types.ts";

/** 全レビュー記録を取得する。itemIdでフィルタ可能 */
export async function getReviews(itemId?: string): Promise<ReviewRecord[]> {
  const data = await readData();
  if (itemId) {
    return data.reviews.filter((review) => review.itemId === itemId);
  }
  return data.reviews;
}

/** レビュー記録を追加する（アイテムの現在の試み番号を自動設定） */
export async function addReview(request: CreateReviewRequest): Promise<ReviewRecord> {
  const data = await readData();
  // 対象アイテムの存在確認
  const item = data.items.find((i) => i.id === request.itemId);
  if (!item) {
    throw new Error(`アイテムが見つかりません: ${request.itemId}`);
  }
  const review: ReviewRecord = {
    id: crypto.randomUUID(),
    itemId: request.itemId,
    adherence: request.adherence,
    reflection: request.reflection,
    reviewedAt: new Date().toISOString(),
    // 後方互換: currentAttempt がなければ1
    attemptNumber: item.currentAttempt ?? 1,
  };
  data.reviews.push(review);
  await writeData(data);
  return review;
}

/** アイテムごとの遵守率サマリーを取得する */
export async function getAdherenceSummary(): Promise<AdherenceSummary[]> {
  const data = await readData();
  const summaryMap = new Map<string, AdherenceSummary>();

  // 全アイテムのエントリを初期化
  for (const item of data.items) {
    summaryMap.set(item.id, {
      itemId: item.id,
      totalReviews: 0,
      keptCount: 0,
      brokeCount: 0,
    });
  }

  // レビューを集計
  for (const review of data.reviews) {
    const summary = summaryMap.get(review.itemId);
    if (!summary) continue;
    summary.totalReviews++;
    if (review.adherence === "kept") {
      summary.keptCount++;
    } else {
      summary.brokeCount++;
    }
  }

  return Array.from(summaryMap.values());
}
