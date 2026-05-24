const KEYS = {
    ITEMS: "not-to-do-items",
    REVIEWS: "not-to-do-reviews",
    PLAN: "not-to-do-plan",
};
// アイテム一覧をlocalStorageから取得
export function getItems() {
    try {
        const raw = localStorage.getItem(KEYS.ITEMS);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function saveItems(items) {
    localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
}
// 新規アイテムを追加してNotToDoItemを返す
export function addItem(title, reason, startDate, targetDays, userId) {
    const now = new Date().toISOString();
    const item = {
        id: crypto.randomUUID(),
        title,
        reason,
        createdAt: now,
        updatedAt: now,
        startDate,
        targetDays,
        currentAttempt: 1,
        ...(userId !== undefined ? { userId } : {}),
    };
    saveItems([...getItems(), item]);
    return item;
}
// アイテムを更新して更新後のアイテムを返す
export function updateItem(id, data) {
    const items = getItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1)
        throw new Error(`アイテムが見つかりません: ${id}`);
    const updated = { ...items[index], ...data, id: items[index].id, updatedAt: new Date().toISOString() };
    items[index] = updated;
    saveItems(items);
    return updated;
}
// アイテムを削除（関連レビューも削除）
export function deleteItem(id) {
    saveItems(getItems().filter((item) => item.id !== id));
    saveReviews(getReviews().filter((review) => review.itemId !== id));
}
// レビュー一覧をlocalStorageから取得
export function getReviews() {
    try {
        const raw = localStorage.getItem(KEYS.REVIEWS);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function saveReviews(reviews) {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
}
// レビューを追加してReviewRecordを返す
export function addReview(itemId, adherence, reflection, userId) {
    const item = getItems().find((i) => i.id === itemId);
    const review = {
        id: crypto.randomUUID(),
        itemId,
        adherence,
        reflection,
        reviewedAt: new Date().toISOString(),
        attemptNumber: item?.currentAttempt ?? 1,
        ...(userId !== undefined ? { userId } : {}),
    };
    saveReviews([...getReviews(), review]);
    return review;
}
// 全レビューからアイテムごとの遵守率サマリーを計算
export function computeSummary(reviews) {
    const map = new Map();
    for (const review of reviews) {
        const s = map.get(review.itemId) ?? {
            itemId: review.itemId,
            totalReviews: 0,
            keptCount: 0,
            brokeCount: 0,
        };
        map.set(review.itemId, {
            ...s,
            totalReviews: s.totalReviews + 1,
            keptCount: s.keptCount + (review.adherence === "kept" ? 1 : 0),
            brokeCount: s.brokeCount + (review.adherence === "broke" ? 1 : 0),
        });
    }
    return Array.from(map.values());
}
// プランを取得（未設定の場合はデフォルト: free / 3件）
export function getPlan(userId) {
    try {
        const raw = localStorage.getItem(KEYS.PLAN);
        const map = raw ? JSON.parse(raw) : {};
        const entry = map[userId];
        if (entry) {
            return { userId: userId, plan: entry.plan, maxItems: entry.maxItems };
        }
    }
    catch {
        // パース失敗時はデフォルトを返す
    }
    return { userId: userId, plan: "free", maxItems: 3 };
}
// プランを設定
export function setPlan(userId, plan, maxItems) {
    try {
        const raw = localStorage.getItem(KEYS.PLAN);
        const map = raw ? JSON.parse(raw) : {};
        map[userId] = { plan, maxItems };
        localStorage.setItem(KEYS.PLAN, JSON.stringify(map));
    }
    catch {
        // 書き込みエラーは無視
    }
}
// 全データをJSON文字列でエクスポート
export function exportAll() {
    return JSON.stringify({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        items: getItems(),
        reviews: getReviews(),
    }, null, 2);
}
// JSON文字列からインポート（ID重複は上書き）
export function importAll(jsonString) {
    const data = JSON.parse(jsonString);
    const importItems = Array.isArray(data.items) ? data.items : [];
    const importReviews = Array.isArray(data.reviews) ? data.reviews : [];
    const itemsMap = new Map(getItems().map((i) => [i.id, i]));
    for (const item of importItems)
        itemsMap.set(item.id, item);
    const reviewsMap = new Map(getReviews().map((r) => [r.id, r]));
    for (const review of importReviews)
        reviewsMap.set(review.id, review);
    saveItems(Array.from(itemsMap.values()));
    saveReviews(Array.from(reviewsMap.values()));
    return { importedItems: importItems.length, importedReviews: importReviews.length };
}
