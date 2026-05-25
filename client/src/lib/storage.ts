import type { AdherenceSummary, NotToDoItem, ReviewRecord, UserPlan } from "../types";

const KEYS = {
  ITEMS: "not-to-do-items",
  REVIEWS: "not-to-do-reviews",
  PLAN: "not-to-do-plan",
} as const;

const DEFAULT_PLAN: UserPlan = { plan: "free", maxItems: 3 };

/** 旧形式（userId キー付き）からの移行用 */
type LegacyPlanStorage = Record<string, { plan: "free" | "pro"; maxItems: number }>;

function normalizePlan(raw: unknown): UserPlan {
  if (!raw || typeof raw !== "object") return DEFAULT_PLAN;

  const data = raw as Record<string, unknown>;
  if (typeof data.plan === "string" && typeof data.maxItems === "number") {
    return { plan: data.plan as UserPlan["plan"], maxItems: data.maxItems };
  }

  const legacy = raw as LegacyPlanStorage;
  const entry = legacy.userA ?? legacy.userB ?? Object.values(legacy)[0];
  if (entry) return { plan: entry.plan, maxItems: entry.maxItems };

  return DEFAULT_PLAN;
}

// アイテム一覧をlocalStorageから取得
export function getItems(): NotToDoItem[] {
  try {
    const raw = localStorage.getItem(KEYS.ITEMS);
    return raw ? (JSON.parse(raw) as NotToDoItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(items: NotToDoItem[]): void {
  localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
}

// 新規アイテムを追加してNotToDoItemを返す
export function addItem(
  title: string,
  reason: string,
  startDate: string,
  targetDays: number,
): NotToDoItem {
  const now = new Date().toISOString();
  const item: NotToDoItem = {
    id: crypto.randomUUID(),
    title,
    reason,
    createdAt: now,
    updatedAt: now,
    startDate,
    targetDays,
    currentAttempt: 1,
  };
  saveItems([...getItems(), item]);
  return item;
}

// アイテムを更新して更新後のアイテムを返す
export function updateItem(
  id: string,
  data: Partial<Pick<NotToDoItem, "title" | "reason" | "completedAt" | "currentAttempt" | "startDate">>,
): NotToDoItem {
  const items = getItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`アイテムが見つかりません: ${id}`);
  const updated: NotToDoItem = { ...items[index], ...data, id: items[index].id, updatedAt: new Date().toISOString() };
  items[index] = updated;
  saveItems(items);
  return updated;
}

// アイテムを削除（関連レビューも削除）
export function deleteItem(id: string): void {
  saveItems(getItems().filter((item) => item.id !== id));
  saveReviews(getReviews().filter((review) => review.itemId !== id));
}

// レビュー一覧をlocalStorageから取得
export function getReviews(): ReviewRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.REVIEWS);
    return raw ? (JSON.parse(raw) as ReviewRecord[]) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: ReviewRecord[]): void {
  localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
}

// レビューを追加してReviewRecordを返す
export function addReview(
  itemId: string,
  adherence: "kept" | "broke",
  reflection: string,
): ReviewRecord {
  const item = getItems().find((i) => i.id === itemId);
  const review: ReviewRecord = {
    id: crypto.randomUUID(),
    itemId,
    adherence,
    reflection,
    reviewedAt: new Date().toISOString(),
    attemptNumber: item?.currentAttempt ?? 1,
  };
  saveReviews([...getReviews(), review]);
  return review;
}

// 全レビューからアイテムごとの遵守率サマリーを計算
export function computeSummary(reviews: ReviewRecord[]): AdherenceSummary[] {
  const map = new Map<string, AdherenceSummary>();
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
export function getPlan(): UserPlan {
  try {
    const raw = localStorage.getItem(KEYS.PLAN);
    if (!raw) return DEFAULT_PLAN;
    return normalizePlan(JSON.parse(raw));
  } catch {
    return DEFAULT_PLAN;
  }
}

// プランを設定
export function setPlan(plan: "free" | "pro", maxItems: number): void {
  try {
    localStorage.setItem(KEYS.PLAN, JSON.stringify({ plan, maxItems }));
  } catch {
    // 書き込みエラーは無視
  }
}

// 全データをJSON文字列でエクスポート
export function exportAll(): string {
  return JSON.stringify(
    {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      items: getItems(),
      reviews: getReviews(),
    },
    null,
    2,
  );
}

// JSON文字列からインポート（ID重複は上書き）
export function importAll(jsonString: string): { importedItems: number; importedReviews: number } {
  const data = JSON.parse(jsonString) as { items?: unknown; reviews?: unknown };
  const importItems = Array.isArray(data.items) ? (data.items as NotToDoItem[]) : [];
  const importReviews = Array.isArray(data.reviews) ? (data.reviews as ReviewRecord[]) : [];

  const itemsMap = new Map(getItems().map((i) => [i.id, i]));
  for (const item of importItems) itemsMap.set(item.id, item);

  const reviewsMap = new Map(getReviews().map((r) => [r.id, r]));
  for (const review of importReviews) reviewsMap.set(review.id, review);

  saveItems(Array.from(itemsMap.values()));
  saveReviews(Array.from(reviewsMap.values()));

  return { importedItems: importItems.length, importedReviews: importReviews.length };
}
