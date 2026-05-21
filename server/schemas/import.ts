/**
 * インポート API のリクエストバリデーションスキーマ。
 * items・reviews が配列であることのみ検証し、
 * 個々の要素の型検証はインポート処理側に委ねる。
 */
import { z } from "zod";

/** POST /api/import: バックアップデータ一括インポートスキーマ */
export const importSchema = z.object({
  items: z.array(z.unknown()),
  reviews: z.array(z.unknown()),
});
