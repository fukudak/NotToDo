/** APIリクエストの共通処理 */
async function request(path, options) {
    const response = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });
    if (!response.ok) {
        const body = (await response.json());
        throw new Error(body.error.message);
    }
    return response.json();
}
/** 全アイテム取得 */
export function fetchItems() {
    return request("/api/items");
}
/** アイテム追加 */
export function createItem(title, reason, startDate, targetDays, userId) {
    return request("/api/items", {
        method: "POST",
        body: JSON.stringify({ title, reason, startDate, targetDays, userId }),
    });
}
/** アイテムのリトライ */
export function retryItem(id) {
    return request(`/api/items/${id}/retry`, {
        method: "POST",
    });
}
/** アイテム更新 */
export function updateItem(id, data) {
    return request(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
/** アイテム削除 */
export function deleteItem(id) {
    return request(`/api/items/${id}`, {
        method: "DELETE",
    });
}
/** レビュー記録取得 */
export function fetchReviews(itemId) {
    const query = itemId ? `?itemId=${itemId}` : "";
    return request(`/api/reviews${query}`);
}
/** レビュー記録追加 */
export function createReview(itemId, adherence, reflection, userId) {
    return request("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ itemId, adherence, reflection, userId }),
    });
}
/** 遵守率サマリー取得 */
export function fetchAdherenceSummary() {
    return request("/api/reviews/summary");
}
/** ユーザーのプラン情報取得 */
export function fetchPlan(userId) {
    return request(`/api/plan/${userId}`);
}
/** バックアップデータを一括インポートする */
export function importBackup(items, reviews) {
    return request("/api/import", {
        method: "POST",
        body: JSON.stringify({ items, reviews }),
    });
}
