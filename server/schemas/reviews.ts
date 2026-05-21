/**
 * レビュー API のリクエストバリデーションスキーマ。
 */
import { z } from "zod";

/** POST /api/reviews: レビュー記録追加スキーマ */
export const createReviewSchema = z.object({
  itemId: z.string().min(1, "itemId は必須です"),
  /** 守れたか（kept）、破ったか（broke）のみ許容 */
  adherence: z.enum(["kept", "broke"]),
  reflection: z
    .string()
    .min(1, "振り返りは1文字以上必要です")
    .max(2000, "振り返りは2000文字以内で指定してください"),
  userId: z.enum(["userA", "userB"]).optional(),
});
