import { Hono } from "hono";
import { readData, writeData } from "../infrastructure/dataRepository.ts";
import type { NotToDoItem, ReviewRecord } from "../domain/types.ts";

interface ImportPayload {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
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
