import { useCallback, useState } from "react";
import { toErrorMessage } from "../lib/errorMessage";
import * as storage from "../lib/storage";
import type { NotToDoItem } from "../types";

interface UseItemsReturn {
  items: NotToDoItem[];
  error: string | null;
  addItem: (title: string, reason: string, startDate: string, targetDays: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  editItem: (id: string, data: { title?: string; reason?: string; completedAt?: string | null }) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useItems(): UseItemsReturn {
  const [items, setItems] = useState<NotToDoItem[]>(() => storage.getItems());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(storage.getItems());
  }, []);

  const addItem = useCallback(
    async (title: string, reason: string, startDate: string, targetDays: number) => {
      try {
        storage.addItem(title, reason, startDate, targetDays);
        setItems(storage.getItems());
      } catch (e) {
        setError(toErrorMessage(e));
        throw e;
      }
    },
    [],
  );

  const removeItem = useCallback(async (id: string) => {
    try {
      storage.deleteItem(id);
      setItems(storage.getItems());
    } catch (e) {
      setError(toErrorMessage(e));
      throw e;
    }
  }, []);

  const retryItem = useCallback(async (id: string) => {
    try {
      const allItems = storage.getItems();
      const item = allItems.find((i) => i.id === id);
      if (!item) throw new Error(`アイテムが見つかりません: ${id}`);
      storage.updateItem(id, {
        currentAttempt: item.currentAttempt + 1,
        startDate: new Date().toISOString().slice(0, 10),
      });
      setItems(storage.getItems());
    } catch (e) {
      setError(toErrorMessage(e));
      throw e;
    }
  }, []);

  const editItem = useCallback(
    async (id: string, data: { title?: string; reason?: string; completedAt?: string | null }) => {
      try {
        const patch: Parameters<typeof storage.updateItem>[1] = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.reason !== undefined) patch.reason = data.reason;
        if ("completedAt" in data) patch.completedAt = data.completedAt ?? undefined;
        storage.updateItem(id, patch);
        setItems(storage.getItems());
      } catch (e) {
        setError(toErrorMessage(e));
        throw e;
      }
    },
    [],
  );

  return { items, error, addItem, removeItem, retryItem, editItem, refresh };
}
