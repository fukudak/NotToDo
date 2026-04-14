import type { AdherenceSummary, NotToDoItem, ReviewRecord } from "../types";

/** APIエラーレスポンス */
interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

/** APIリクエストの共通処理 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json()) as ApiError;
    throw new Error(body.error.message);
  }
  return response.json() as Promise<T>;
}

/** 全アイテム取得 */
export function fetchItems(): Promise<NotToDoItem[]> {
  return request<NotToDoItem[]>("/api/items");
}

/** アイテム追加 */
export function createItem(
  title: string,
  reason: string,
  startDate: string,
  targetDays: number,
): Promise<NotToDoItem> {
  return request<NotToDoItem>("/api/items", {
    method: "POST",
    body: JSON.stringify({ title, reason, startDate, targetDays }),
  });
}

/** アイテムのリトライ */
export function retryItem(id: string): Promise<NotToDoItem> {
  return request<NotToDoItem>(`/api/items/${id}/retry`, {
    method: "POST",
  });
}

/** アイテム更新 */
export function updateItem(
  id: string,
  data: { title?: string; reason?: string },
): Promise<NotToDoItem> {
  return request<NotToDoItem>(`/api/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** アイテム削除 */
export function deleteItem(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/items/${id}`, {
    method: "DELETE",
  });
}

/** レビュー記録取得 */
export function fetchReviews(itemId?: string): Promise<ReviewRecord[]> {
  const query = itemId ? `?itemId=${itemId}` : "";
  return request<ReviewRecord[]>(`/api/reviews${query}`);
}

/** レビュー記録追加 */
export function createReview(
  itemId: string,
  adherence: "kept" | "broke",
  reflection: string,
): Promise<ReviewRecord> {
  return request<ReviewRecord>("/api/reviews", {
    method: "POST",
    body: JSON.stringify({ itemId, adherence, reflection }),
  });
}

/** 遵守率サマリー取得 */
export function fetchAdherenceSummary(): Promise<AdherenceSummary[]> {
  return request<AdherenceSummary[]>("/api/reviews/summary");
}

/** バックアップデータを一括インポートする */
export function importBackup(
  items: NotToDoItem[],
  reviews: ReviewRecord[],
): Promise<{ success: boolean; importedItems: number; importedReviews: number }> {
  return request<{ success: boolean; importedItems: number; importedReviews: number }>(
    "/api/import",
    {
      method: "POST",
      body: JSON.stringify({ items, reviews }),
    },
  );
}
