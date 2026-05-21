import { useEffect, useState } from "react";
import { fetchPlan } from "../api/client";
import type { UserPlan } from "../types";

interface UsePlanReturn {
  plan: UserPlan | null;
  loading: boolean;
  error: string | null;
}

export function usePlan(userId: string): UsePlanReturn {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPlan(userId)
      .then(setPlan)
      .catch((e) => setError(e instanceof Error ? e.message : "不明なエラー"))
      .finally(() => setLoading(false));
  }, [userId]);

  return { plan, loading, error };
}
