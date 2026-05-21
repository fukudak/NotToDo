import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { getPlan, PlanLimitError } from "./planService.ts";
import type { CreateItemRequest, NotToDoItem, UpdateItemRequest } from "./types.ts";

/** 日付文字列をYYYY-MM-DD形式に変換する */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 全アイテムを取得する */
export async function getAllItems(): Promise<NotToDoItem[]> {
  const data = await readData();
  return data.items;
}

/** 新しいアイテムを追加する */
export async function addItem(request: CreateItemRequest): Promise<NotToDoItem> {
  const data = await readData();
  const userId = request.userId ?? "userA";

  const plan = await getPlan(userId);
  const userItemCount = data.items.filter((item) => (item.userId ?? "userA") === userId).length;
  if (userItemCount >= plan.maxItems) {
    throw new PlanLimitError(plan.maxItems);
  }

  const now = new Date().toISOString();
  const today = toDateString(new Date());
  const item: NotToDoItem = {
    id: crypto.randomUUID(),
    title: request.title,
    reason: request.reason,
    createdAt: now,
    updatedAt: now,
    startDate: request.startDate ?? today,
    targetDays: request.targetDays ?? 66,
    currentAttempt: 1,
    userId,
  };
  data.items.push(item);
  await writeData(data);
  return item;
}

/** アイテムを更新する */
export async function updateItem(id: string, request: UpdateItemRequest): Promise<NotToDoItem> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`アイテムが見つかりません: ${id}`);
  }
  const existing = data.items[index]!;
  const updated: NotToDoItem = {
    ...existing,
    title: request.title ?? existing.title,
    reason: request.reason ?? existing.reason,
    completedAt: request.completedAt === null ? undefined : (request.completedAt ?? existing.completedAt),
    updatedAt: new Date().toISOString(),
  };
  data.items[index] = updated;
  await writeData(data);
  return updated;
}

/** アイテムをリトライする（試み番号を増やし開始日をリセット） */
export async function retryItem(id: string): Promise<NotToDoItem> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`アイテムが見つかりません: ${id}`);
  }
  const existing = data.items[index]!;
  const retried: NotToDoItem = {
    ...existing,
    // 後方互換: currentAttempt がなければ1として扱う
    currentAttempt: (existing.currentAttempt ?? 1) + 1,
    startDate: toDateString(new Date()),
    updatedAt: new Date().toISOString(),
  };
  data.items[index] = retried;
  await writeData(data);
  return retried;
}

/** アイテムを削除する */
export async function deleteItem(id: string): Promise<void> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`アイテムが見つかりません: ${id}`);
  }
  data.items.splice(index, 1);
  // 関連するレビューも削除
  data.reviews = data.reviews.filter((review) => review.itemId !== id);
  await writeData(data);
}
