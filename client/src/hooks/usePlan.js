import { useEffect, useState } from "react";
import * as storage from "../lib/storage";
export function usePlan(userId) {
    // localStorageから同期的に初期化（デフォルト: free / 3件）
    const [plan, setPlanState] = useState(() => storage.getPlan(userId));
    // userIdが変わったらプランを再取得
    useEffect(() => {
        setPlanState(storage.getPlan(userId));
    }, [userId]);
    return { plan, loading: false, error: null };
}
