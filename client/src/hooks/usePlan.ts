import { useState } from "react";
import * as storage from "../lib/storage";
import type { UserPlan } from "../types";

interface UsePlanReturn {
  plan: UserPlan;
}

export function usePlan(): UsePlanReturn {
  const [plan] = useState<UserPlan>(() => storage.getPlan());
  return { plan };
}
