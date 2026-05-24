import { useCallback, useState } from "react";
import * as storage from "../lib/storage";
export function useReviews() {
    // localStorageから同期的に初期化
    const [reviews, setReviews] = useState(() => storage.getReviews());
    const [summary, setSummary] = useState(() => storage.computeSummary(storage.getReviews()));
    const [error, setError] = useState(null);
    // localStorageを再読み込みしてstateを更新
    const refresh = useCallback(async () => {
        const data = storage.getReviews();
        setReviews(data);
        setSummary(storage.computeSummary(data));
    }, []);
    // レビューを追加してstateとサマリーを更新
    const addReview = useCallback(async (itemId, adherence, reflection, userId) => {
        try {
            storage.addReview(itemId, adherence, reflection, userId);
            const data = storage.getReviews();
            setReviews(data);
            setSummary(storage.computeSummary(data));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラー");
            throw e;
        }
    }, []);
    return { reviews, summary, loading: false, error, addReview, refresh };
}
