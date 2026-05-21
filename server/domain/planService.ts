import { readPlans } from "../infrastructure/planRepository.ts";
import type { UserId, UserPlan } from "./types.ts";

const FREE_MAX_ITEMS = 3;
const PRO_MAX_ITEMS = 9999;

export class PlanLimitError extends Error {
  constructor(public readonly maxItems: number) {
    super(`無料版は${maxItems}件までです。アップグレードしてください。`);
    this.name = "PlanLimitError";
  }
}

function defaultPlan(userId: UserId): UserPlan {
  return { userId, plan: "free", maxItems: FREE_MAX_ITEMS };
}

export async function getPlan(userId: UserId): Promise<UserPlan> {
  const data = await readPlans();
  const found = data.plans.find((p) => p.userId === userId);
  return found ?? defaultPlan(userId);
}

export { FREE_MAX_ITEMS, PRO_MAX_ITEMS };
