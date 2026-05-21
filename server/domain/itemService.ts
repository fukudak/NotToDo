/**
 * アイテムのビジネスロジック層。
 * CRUD 操作・プラン制限チェック・ユーザー境界チェックを担う。
 */
import { readData, writeData } from "../infrastructure/dataRepository.ts";
import { getPlan, PlanLimitError } from "./planService.ts";
import { ForbiddenError, NotFoundError } from "../errors.ts";
import type { CreateItemRequest, NotToDoItem, UpdateItemRequest, UserId } from "./types.ts";

/** Date を YYYY-MM-DD 形式の文字列に変換する */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * 全アイテムを取得する。
 * @returns 保存されている全アイテムの配列
 */
export async function getAllItems(): Promise<NotToDoItem[]> {
  const data = await readData();
  return data.items;
}

/**
 * 新しいアイテムを追加する。
 * 無料プランの件数制限を超える場合は PlanLimitError をスローする。
 * @param request - 作成リクエスト（title・reason 必須）
 * @returns 作成されたアイテム
 */
export async function addItem(request: CreateItemRequest): Promise<NotToDoItem> {
  const data = await readData();
  const userId = request.userId ?? "userA";

  // プラン件数制限チェック（ユーザーごとに独立）
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

/**
 * アイテムを更新する。
 * request.userId が指定されている場合、アイテムの所有者と照合する。
 * @param id - 更新対象のアイテム ID
 * @param request - 更新内容（title・reason・completedAt のいずれか）
 * @returns 更新後のアイテム
 */
export async function updateItem(id: string, request: UpdateItemRequest): Promise<NotToDoItem> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new NotFoundError(`アイテムが見つかりません: ${id}`);
  }
  const existing = data.items[index]!;

  // ユーザー境界チェック: 両方の userId が揃っているときのみ照合
  if (request.userId && existing.userId && request.userId !== existing.userId) {
    throw new ForbiddenError("このアイテムを更新する権限がありません");
  }

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

/**
 * アイテムをリトライする（試み番号を増やし開始日をリセット）。
 * @param id - リトライ対象のアイテム ID
 * @param requestUserId - リクエスト元のユーザー ID（省略時は境界チェックをスキップ）
 * @returns リトライ後のアイテム
 */
export async function retryItem(id: string, requestUserId?: UserId): Promise<NotToDoItem> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new NotFoundError(`アイテムが見つかりません: ${id}`);
  }
  const existing = data.items[index]!;

  // ユーザー境界チェック
  if (requestUserId && existing.userId && requestUserId !== existing.userId) {
    throw new ForbiddenError("このアイテムをリトライする権限がありません");
  }

  const retried: NotToDoItem = {
    ...existing,
    // 後方互換: currentAttempt がなければ 1 として扱う
    currentAttempt: (existing.currentAttempt ?? 1) + 1,
    startDate: toDateString(new Date()),
    updatedAt: new Date().toISOString(),
  };
  data.items[index] = retried;
  await writeData(data);
  return retried;
}

/**
 * アイテムを削除する。関連するレビューも同時に削除する。
 * @param id - 削除対象のアイテム ID
 * @param requestUserId - リクエスト元のユーザー ID（省略時は境界チェックをスキップ）
 */
export async function deleteItem(id: string, requestUserId?: UserId): Promise<void> {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new NotFoundError(`アイテムが見つかりません: ${id}`);
  }
  const existing = data.items[index]!;

  // ユーザー境界チェック
  if (requestUserId && existing.userId && requestUserId !== existing.userId) {
    throw new ForbiddenError("このアイテムを削除する権限がありません");
  }

  data.items.splice(index, 1);
  // 関連するレビューも削除してデータ整合性を保つ
  data.reviews = data.reviews.filter((review) => review.itemId !== id);
  await writeData(data);
}
