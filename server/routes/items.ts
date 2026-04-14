import { Hono } from "hono";
import { addItem, deleteItem, getAllItems, retryItem, updateItem } from "../domain/itemService.ts";
import { NotFoundError, ValidationError } from "../domain/errors.ts";
import type { CreateItemRequest, UpdateItemRequest } from "../domain/types.ts";

const itemRoutes = new Hono();

/** YYYY-MM-DD形式の日付文字列かどうかを検証する */
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !isNaN(new Date(value).getTime());
}

/** 全アイテム取得 */
itemRoutes.get("/", async (c) => {
  const items = await getAllItems();
  return c.json(items);
});

/** 新規アイテム追加 */
itemRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateItemRequest>();
  if (!body.title?.trim() || !body.reason?.trim()) {
    return c.json({ error: { code: "INVALID_INPUT", message: "titleとreasonは必須です" } }, 400);
  }
  if (body.startDate !== undefined && !isValidDateString(body.startDate)) {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "startDateはYYYY-MM-DD形式で指定してください" } },
      400,
    );
  }
  if (
    body.targetDays !== undefined &&
    (!Number.isInteger(body.targetDays) || body.targetDays < 1 || body.targetDays > 365)
  ) {
    return c.json(
      { error: { code: "INVALID_INPUT", message: "targetDaysは1〜365の整数で指定してください" } },
      400,
    );
  }
  const item = await addItem(body);
  return c.json(item, 201);
});

/** アイテム更新 */
itemRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateItemRequest>();
  try {
    const item = await updateItem(id, body);
    return c.json(item);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ error: { code: "ITEM_NOT_FOUND", message: e.message } }, 404);
    }
    throw e;
  }
});

/** アイテム削除 */
itemRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await deleteItem(id);
    return c.json({ success: true });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ error: { code: "ITEM_NOT_FOUND", message: e.message } }, 404);
    }
    throw e;
  }
});

/** リトライ（試み番号を増やして開始日をリセット） */
itemRoutes.post("/:id/retry", async (c) => {
  const id = c.req.param("id");
  try {
    const item = await retryItem(id);
    return c.json(item);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return c.json({ error: { code: "ITEM_NOT_FOUND", message: e.message } }, 404);
    }
    throw e;
  }
});

export { itemRoutes };
