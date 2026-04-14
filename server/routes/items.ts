import { Hono } from "hono";
import { addItem, deleteItem, getAllItems, retryItem, updateItem } from "../domain/itemService.ts";
import type { CreateItemRequest, UpdateItemRequest } from "../domain/types.ts";

const itemRoutes = new Hono();

/** 全アイテム取得 */
itemRoutes.get("/", async (c) => {
  const items = await getAllItems();
  return c.json(items);
});

/** 新規アイテム追加 */
itemRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateItemRequest>();
  if (!body.title || !body.reason) {
    return c.json({ error: { code: "INVALID_INPUT", message: "titleとreasonは必須です" } }, 400);
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
    if (e instanceof Error && e.message.includes("見つかりません")) {
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
    if (e instanceof Error && e.message.includes("見つかりません")) {
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
    if (e instanceof Error && e.message.includes("見つかりません")) {
      return c.json({ error: { code: "ITEM_NOT_FOUND", message: e.message } }, 404);
    }
    throw e;
  }
});

export { itemRoutes };
