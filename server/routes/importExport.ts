import { Hono } from "hono";
import { readData, writeData } from "../infrastructure/dataRepository.ts";
import type { NotToDoItem, ReviewRecord } from "../domain/types.ts";

interface ImportPayload {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
}

/** アイテムオブジェクトの必須フィールドを検証する */
function isValidItem(item: unknown): item is NotToDoItem {
  if (!item || typeof item !== "object") return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj["id"] === "string" &&
    typeof obj["title"] === "string" &&
    obj["title"].trim() !== "" &&
    typeof obj["reason"] === "string" &&
    typeof obj["createdAt"] === "string" &&
    typeof obj["startDate"] === "string" &&
    typeof obj["targetDays"] === "number" &&
    obj["targetDays"] > 0 &&
    typeof obj["currentAttempt"] === "number" &&
    obj["currentAttempt"] >= 1
  );
}

/** レビューオブジェクトの必須フィールドを検証する */
function isValidReview(review: unknown): review is ReviewRecord {
  if (!review || typeof review !== "object") return false;
  const obj = review as Record<string, unknown>;
  return (
    typeof obj["id"] === "string" &&
    typeof obj["itemId"] === "string" &&
    (obj["adherence"] === "kept" || obj["adherence"] === "broke") &&
    typeof obj["reflection"] === "string" &&
    typeof obj["reviewedAt"] === "string" &&
    typeof obj["attemptNumber"] === "number"
  );
}

const importExportRoutes = new Hono();

/** バックアップデータを一括インポートする（ID重複は上書き、新規IDは追加） */
importExportRoutes.post("/import", async (c) => {
  const body = await c.req.json<ImportPayload>();
  if (!Array.isArray(body.items) || !Array.isArray(body.reviews)) {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "items と reviews が必要です" } },
      400,
    );
  }

  // 各アイテム・レビューのフィールドを検証
  const invalidItemIndex = body.items.findIndex((item) => !isValidItem(item));
  if (invalidItemIndex !== -1) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: `items[${invalidItemIndex}] の形式が不正です`,
        },
      },
      400,
    );
  }

  const invalidReviewIndex = body.reviews.findIndex((review) => !isValidReview(review));
  if (invalidReviewIndex !== -1) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: `reviews[${invalidReviewIndex}] の形式が不正です`,
        },
      },
      400,
    );
  }

  const existing = await readData();

  // ID重複は上書き、新規IDは追加
  const itemMap = new Map(existing.items.map((i) => [i.id, i]));
  for (const item of body.items) {
    itemMap.set(item.id, item);
  }

  const reviewMap = new Map(existing.reviews.map((r) => [r.id, r]));
  for (const review of body.reviews) {
    reviewMap.set(review.id, review);
  }

  await writeData({
    items: Array.from(itemMap.values()),
    reviews: Array.from(reviewMap.values()),
  });

  return c.json({
    success: true,
    importedItems: body.items.length,
    importedReviews: body.reviews.length,
  });
});

/** 全データをエクスポートする */
importExportRoutes.get("/export", async (c) => {
  const data = await readData();
  return c.json({
    version: "1.0",
    exportedAt: new Date().toISOString(),
    items: data.items,
    reviews: data.reviews,
  });
});

export { importExportRoutes };
