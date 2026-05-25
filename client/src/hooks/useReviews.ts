import { useCallback, useState } from "react";
import { toErrorMessage } from "../lib/errorMessage";
import * as storage from "../lib/storage";
import type { AdherenceSummary, ReviewRecord } from "../types";

interface UseReviewsReturn {
  reviews: ReviewRecord[];
  summary: AdherenceSummary[];
  error: string | null;
  addReview: (itemId: string, adherence: "kept" | "broke", reflection: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => storage.getReviews());
  const [summary, setSummary] = useState<AdherenceSummary[]>(() =>
    storage.computeSummary(storage.getReviews()),
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = storage.getReviews();
    setReviews(data);
    setSummary(storage.computeSummary(data));
  }, []);

  const addReview = useCallback(
    async (itemId: string, adherence: "kept" | "broke", reflection: string) => {
      try {
        storage.addReview(itemId, adherence, reflection);
        const data = storage.getReviews();
        setReviews(data);
        setSummary(storage.computeSummary(data));
      } catch (e) {
        setError(toErrorMessage(e));
        throw e;
      }
    },
    [],
  );

  return { reviews, summary, error, addReview, refresh };
}
