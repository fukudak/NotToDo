import { useEffect, useState } from "react";
import * as storage from "../lib/storage";
import type { UserPlan } from "../types";

interface UsePlanReturn {
  plan: UserPlan | null;
  loading: boolean;
  error: string | null;
}

export function usePlan(userId: string): UsePlanReturn {
  // localStorageから同期的に初期化（デフォルト: free / 3件）
  const [plan, setPlanState] = useState<UserPlan>(() => storage.getPlan(userId));

  // userIdが変わったらプランを再取得
  useEffect(() => {
    setPlanState(storage.getPlan(userId));
  }, [userId]);

  return { plan, loading: false, error: null };
}
