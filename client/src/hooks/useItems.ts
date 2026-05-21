import { useCallback, useState } from "react";
import * as storage from "../lib/storage";
import type { NotToDoItem } from "../types";

interface UseItemsReturn {
  items: NotToDoItem[];
  loading: boolean;
  error: string | null;
  addItem: (
    title: string,
    reason: string,
    startDate: string,
    targetDays: number,
    userId?: string,
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  editItem: (id: string, data: { title?: string; reason?: string; completedAt?: string | null }) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useItems(): UseItemsReturn {
  // localStorageから同期的に初期化
  const [items, setItems] = useState<NotToDoItem[]>(() => storage.getItems());
  const [error, setError] = useState<string | null>(null);

  // localStorageを再読み込みしてstateを更新
  const refresh = useCallback(async () => {
    setItems(storage.getItems());
  }, []);

  // アイテムを追加してstateを更新
  const addItem = useCallback(
    async (title: string, reason: string, startDate: string, targetDays: number, userId?: string) => {
      try {
        storage.addItem(title, reason, startDate, targetDays, userId);
        setItems(storage.getItems());
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラー");
        throw e;
      }
    },
    [],
  );

  // アイテムを削除してstateを更新
  const removeItem = useCallback(async (id: string) => {
    try {
      storage.deleteItem(id);
      setItems(storage.getItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      throw e;
    }
  }, []);

  // 再挑戦: currentAttemptをインクリメントしてstartDateを今日にリセット
  const retryItem = useCallback(async (id: string) => {
    try {
      const items = storage.getItems();
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error(`アイテムが見つかりません: ${id}`);
      storage.updateItem(id, {
        currentAttempt: item.currentAttempt + 1,
        startDate: new Date().toISOString().slice(0, 10),
      });
      setItems(storage.getItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      throw e;
    }
  }, []);

  // アイテムのタイトル・理由・完了日を更新
  const editItem = useCallback(
    async (id: string, data: { title?: string; reason?: string; completedAt?: string | null }) => {
      try {
        // null は undefined に変換（updateItemはPartialを受け取る）
        const patch: Parameters<typeof storage.updateItem>[1] = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.reason !== undefined) patch.reason = data.reason;
        if ("completedAt" in data) patch.completedAt = data.completedAt ?? undefined;
        storage.updateItem(id, patch);
        setItems(storage.getItems());
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラー");
        throw e;
      }
    },
    [],
  );

  return { items, loading: false, error, addItem, removeItem, retryItem, editItem, refresh };
}
