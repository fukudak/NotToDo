import { useCallback, useState } from "react";
import * as storage from "../lib/storage";
export function useItems() {
    // localStorageから同期的に初期化
    const [items, setItems] = useState(() => storage.getItems());
    const [error, setError] = useState(null);
    // localStorageを再読み込みしてstateを更新
    const refresh = useCallback(async () => {
        setItems(storage.getItems());
    }, []);
    // アイテムを追加してstateを更新
    const addItem = useCallback(async (title, reason, startDate, targetDays, userId) => {
        try {
            storage.addItem(title, reason, startDate, targetDays, userId);
            setItems(storage.getItems());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラー");
            throw e;
        }
    }, []);
    // アイテムを削除してstateを更新
    const removeItem = useCallback(async (id) => {
        try {
            storage.deleteItem(id);
            setItems(storage.getItems());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラー");
            throw e;
        }
    }, []);
    // 再挑戦: currentAttemptをインクリメントしてstartDateを今日にリセット
    const retryItem = useCallback(async (id) => {
        try {
            const items = storage.getItems();
            const item = items.find((i) => i.id === id);
            if (!item)
                throw new Error(`アイテムが見つかりません: ${id}`);
            storage.updateItem(id, {
                currentAttempt: item.currentAttempt + 1,
                startDate: new Date().toISOString().slice(0, 10),
            });
            setItems(storage.getItems());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラー");
            throw e;
        }
    }, []);
    // アイテムのタイトル・理由・完了日を更新
    const editItem = useCallback(async (id, data) => {
        try {
            // null は undefined に変換（updateItemはPartialを受け取る）
            const patch = {};
            if (data.title !== undefined)
                patch.title = data.title;
            if (data.reason !== undefined)
                patch.reason = data.reason;
            if ("completedAt" in data)
                patch.completedAt = data.completedAt ?? undefined;
            storage.updateItem(id, patch);
            setItems(storage.getItems());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラー");
            throw e;
        }
    }, []);
    return { items, loading: false, error, addItem, removeItem, retryItem, editItem, refresh };
}
