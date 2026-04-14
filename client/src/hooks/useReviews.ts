import { useCallback, useEffect, useState } from "react";
import * as api from "../api/client";
import type { AdherenceSummary, ReviewRecord } from "../types";

interface UseReviewsReturn {
  reviews: ReviewRecord[];
  summary: AdherenceSummary[];
  loading: boolean;
  error: string | null;
  addReview: (itemId: string, adherence: "kept" | "broke", reflection: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [summary, setSummary] = useState<AdherenceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewData, summaryData] = await Promise.all([
        api.fetchReviews(),
        api.fetchAdherenceSummary(),
      ]);
      setReviews(reviewData);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addReview = useCallback(
    async (itemId: string, adherence: "kept" | "broke", reflection: string) => {
      const review = await api.createReview(itemId, adherence, reflection);
      setReviews((prev) => [...prev, review]);
      // サマリーも再取得
      const summaryData = await api.fetchAdherenceSummary();
      setSummary(summaryData);
    },
    [],
  );

  return { reviews, summary, loading, error, addReview, refresh };
}
