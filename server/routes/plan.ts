import { Hono } from "hono";
import { getPlan } from "../domain/planService.ts";
import type { UserId } from "../domain/types.ts";

const planRoutes = new Hono();

/** ユーザーのプラン情報取得 */
planRoutes.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (userId !== "userA" && userId !== "userB") {
    return c.json({ error: { code: "INVALID_USER", message: "無効なユーザーIDです" } }, 400);
  }
  const plan = await getPlan(userId as UserId);
  return c.json(plan);
});

export { planRoutes };
