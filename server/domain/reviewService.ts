/**
 * レビュー記録のビジネスロジック層。
 * レビューの取得・追加・サマリー集計を担う。
 */
import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { NotFoundError } from "../errors.ts";
import type { AdherenceSummary, CreateReviewRequest, ReviewRecord } from "./types.ts";

/**
 * 全レビュー記録を取得する。itemId を指定するとフィルタできる。
 * @param itemId - フィルタするアイテム ID（省略時は全件返す）
 * @returns レビュー記録の配列
 */
export async function getReviews(itemId?: string): Promise<ReviewRecord[]> {
  const data = await readData();
  if (itemId) {
    return data.reviews.filter((review) => review.itemId === itemId);
  }
  return data.reviews;
}

/**
 * レビュー記録を追加する。
 * アイテムの現在の試み番号（currentAttempt）を自動設定する。
 * @param request - レビュー作成リクエスト
 * @returns 作成されたレビュー記録
 */
export async function addReview(request: CreateReviewRequest): Promise<ReviewRecord> {
  const data = await readData();
  // 対象アイテムの存在確認（存在しないアイテムへのレビューは不整合を生む）
  const item = data.items.find((i) => i.id === request.itemId);
  if (!item) {
    throw new NotFoundError(`アイテムが見つかりません: ${request.itemId}`);
  }
  const review: ReviewRecord = {
    id: crypto.randomUUID(),
    itemId: request.itemId,
    adherence: request.adherence,
    reflection: request.reflection,
    reviewedAt: new Date().toISOString(),
    // 後方互換: currentAttempt がなければ 1 として扱う
    attemptNumber: item.currentAttempt ?? 1,
    userId: request.userId ?? item.userId ?? "userA",
  };
  data.reviews.push(review);
  await writeData(data);
  return review;
}

/**
 * アイテムごとの遵守率サマリーを集計して返す。
 * @returns 全アイテムの kept/broke カウントサマリー配列
 */
export async function getAdherenceSummary(): Promise<AdherenceSummary[]> {
  const data = await readData();
  const summaryMap = new Map<string, AdherenceSummary>();

  // 全アイテムのエントリを初期化（レビューが0件でも含める）
  for (const item of data.items) {
    summaryMap.set(item.id, {
      itemId: item.id,
      totalReviews: 0,
      keptCount: 0,
      brokeCount: 0,
    });
  }

  // レビューを集計してサマリーに反映
  for (const review of data.reviews) {
    const summary = summaryMap.get(review.itemId);
    if (!summary) continue; // 対応アイテムが削除済みの場合はスキップ
    summary.totalReviews++;
    if (review.adherence === "kept") {
      summary.keptCount++;
    } else {
      summary.brokeCount++;
    }
  }

  return Array.from(summaryMap.values());
}
