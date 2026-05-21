/**
 * アイテム API のリクエストバリデーションスキーマ。
 * @hono/zod-validator ミドルウェアで使用し、不正入力を早期に弾く。
 */
import { z } from "zod";

/** POST /api/items: 新規アイテム作成スキーマ */
export const createItemSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは1文字以上必要です")
    .max(200, "タイトルは200文字以内で指定してください"),
  reason: z
    .string()
    .min(1, "理由は1文字以上必要です")
    .max(1000, "理由は1000文字以内で指定してください"),
  /** 省略時は今日の日付を使用（サービス層でデフォルト補完） */
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate は YYYY-MM-DD 形式で指定してください")
    .optional(),
  /** 省略時は 66日（Lally 2010 習慣化研究の平均値） */
  targetDays: z.number().int().min(1).max(365).optional(),
  userId: z.enum(["userA", "userB"]).optional(),
});

/** PUT /api/items/:id: アイテム更新スキーマ（全フィールド省略可） */
export const updateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  reason: z.string().min(1).max(1000).optional(),
  /** null を渡すと完了状態をリセットする */
  completedAt: z.string().nullable().optional(),
  /** ユーザー境界チェック用: 指定するとアイテムの userId と照合する */
  userId: z.enum(["userA", "userB"]).optional(),
});
