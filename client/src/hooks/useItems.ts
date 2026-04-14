import { useCallback, useEffect, useState } from "react";
import * as api from "../api/client";
import type { NotToDoItem } from "../types";

interface UseItemsReturn {
  items: NotToDoItem[];
  loading: boolean;
  error: string | null;
  addItem: (title: string, reason: string, startDate: string, targetDays: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  editItem: (id: string, data: { title?: string; reason?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useItems(): UseItemsReturn {
  const [items, setItems] = useState<NotToDoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchItems();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (title: string, reason: string, startDate: string, targetDays: number) => {
      const item = await api.createItem(title, reason, startDate, targetDays);
      setItems((prev) => [...prev, item]);
    },
    [],
  );

  const removeItem = useCallback(async (id: string) => {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const retryItem = useCallback(async (id: string) => {
    const updated = await api.retryItem(id);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }, []);

  const editItem = useCallback(async (id: string, data: { title?: string; reason?: string }) => {
    const updated = await api.updateItem(id, data);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }, []);

  return { items, loading, error, addItem, removeItem, retryItem, editItem, refresh };
}
