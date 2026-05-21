import { useCallback, useState } from "react";
import * as storage from "../lib/storage";
import type { AdherenceSummary, ReviewRecord } from "../types";

interface UseReviewsReturn {
  reviews: ReviewRecord[];
  summary: AdherenceSummary[];
  loading: boolean;
  error: string | null;
  addReview: (
    itemId: string,
    adherence: "kept" | "broke",
    reflection: string,
    userId?: string,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviews(): UseReviewsReturn {
  // localStorageから同期的に初期化
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => storage.getReviews());
  const [summary, setSummary] = useState<AdherenceSummary[]>(() =>
    storage.computeSummary(storage.getReviews()),
  );
  const [error, setError] = useState<string | null>(null);

  // localStorageを再読み込みしてstateを更新
  const refresh = useCallback(async () => {
    const data = storage.getReviews();
    setReviews(data);
    setSummary(storage.computeSummary(data));
  }, []);

  // レビューを追加してstateとサマリーを更新
  const addReview = useCallback(
    async (itemId: string, adherence: "kept" | "broke", reflection: string, userId?: string) => {
      try {
        storage.addReview(itemId, adherence, reflection, userId);
        const data = storage.getReviews();
        setReviews(data);
        setSummary(storage.computeSummary(data));
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラー");
        throw e;
      }
    },
    [],
  );

  return { reviews, summary, loading: false, error, addReview, refresh };
}
