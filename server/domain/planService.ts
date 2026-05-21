/**
 * プラン管理ビジネスロジック。
 * ユーザーのプラン情報取得と、件数制限エラーの定義を担う。
 */
import { readPlans } from "../infrastructure/planRepository.ts";
import { AppError } from "../errors.ts";
import type { UserId, UserPlan } from "./types.ts";

const FREE_MAX_ITEMS = 3;
const PRO_MAX_ITEMS = 9999;

/**
 * 無料プランの件数制限超過エラー（HTTP 403）。
 * グローバルエラーハンドラーが PLAN_LIMIT_EXCEEDED コードで応答する。
 */
export class PlanLimitError extends AppError {
  constructor(public readonly maxItems: number) {
    super(403, "PLAN_LIMIT_EXCEEDED", `無料版は${maxItems}件までです。アップグレードしてください。`);
    this.name = "PlanLimitError";
  }
}

/** 未登録ユーザーのデフォルトプラン（無料・最大3件） */
function defaultPlan(userId: UserId): UserPlan {
  return { userId, plan: "free", maxItems: FREE_MAX_ITEMS };
}

/**
 * ユーザーのプラン情報を取得する。
 * 未登録の場合は無料プランをデフォルト値として返す。
 * @param userId - 対象ユーザー ID
 * @returns ユーザーのプラン情報
 */
export async function getPlan(userId: UserId): Promise<UserPlan> {
  const data = await readPlans();
  const found = data.plans.find((p) => p.userId === userId);
  return found ?? defaultPlan(userId);
}

export { FREE_MAX_ITEMS, PRO_MAX_ITEMS };
