import { Hono } from "hono";
import { addReview, getAdherenceSummary, getReviews } from "../domain/reviewService.ts";
import { NotFoundError } from "../domain/errors.ts";
import type { CreateReviewRequest } from "../domain/types.ts";

const reviewRoutes = new Hono();

/** 全レビュー取得（itemIdでフィルタ可能） */
reviewRoutes.get("/", async (c) => {
  const itemId = c.req.query("itemId");
  const reviews = await getReviews(itemId);
  return c.json(reviews);
});

/** 遵守率サマリー取得 */
reviewRoutes.get("/summary", async (c) => {
  const summary = await getAdherenceSummary();
  return c.json(summary);
});

/** レビュー記録追加 */
reviewRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateReviewRequest>();
  if (!body.itemId || !body.adherence || body.reflection === undefined) {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "itemId, adherence, reflectionは必須です" } },
      400,
    );
  }
  if (body.adherence !== "kept" && body.adherence !== "broke") {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "adherenceは 'kept' または 'broke' のみ有効です" } },
      400,
    );
  }
  try {
    const review = await addReview(body);
    return c.json(review, 201);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ error: { code: "ITEM_NOT_FOUND", message: e.message } }, 404);
    }
    throw e;
  }
});

export { reviewRoutes };
