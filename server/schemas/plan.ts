/**
 * プラン API のバリデーションスキーマ。
 */
import { z } from "zod";

/** GET /api/plan/:userId: userId パスパラメータの許容値 */
export const userIdSchema = z.enum(["userA", "userB"]);
