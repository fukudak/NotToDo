export type UserId = "userA" | "userB";

/** やらないことアイテム */
export interface NotToDoItem {
  id: string;
  /** やらないこと */
  title: string;
  /** なぜやらないか */
  reason: string;
  createdAt: string;
  updatedAt: string;
  /** 現在の試みの開始日 (ISO 8601) */
  startDate: string;
  /** 習慣化目標日数 (Lally 2010: 平均66日) */
  targetDays: number;
  /** 現在の試み番号 (1始まり) */
  currentAttempt: number;
  /** 完了日時。未完了なら undefined */
  completedAt?: string;
  userId?: UserId;
}

/** 振り返り記録 */
export interface ReviewRecord {
  id: string;
  /** 対象アイテムのID */
  itemId: string;
  /** 守れたか、破ったか */
  adherence: "kept" | "broke";
  /** 振り返りコメント */
  reflection: string;
  reviewedAt: string;
  /** 何回目の試みのレビューか */
  attemptNumber: number;
  userId?: UserId;
}

/** JSONファイルのルート構造 */
export interface NotToDoData {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
}

/** アイテム作成リクエスト */
export interface CreateItemRequest {
  title: string;
  reason: string;
  /** 開始日 (省略時は今日) */
  startDate?: string;
  /** 目標日数 (省略時は66) */
  targetDays?: number;
  userId?: UserId;
}

/** アイテム更新リクエスト */
export interface UpdateItemRequest {
  title?: string;
  reason?: string;
  completedAt?: string | null;
}

/** レビュー作成リクエスト */
export interface CreateReviewRequest {
  itemId: string;
  adherence: "kept" | "broke";
  reflection: string;
  userId?: UserId;
}

/** ユーザープラン */
export interface UserPlan {
  userId: UserId;
  plan: "free" | "pro";
  maxItems: number;
}

/** アイテムごとの遵守率サマリー */
export interface AdherenceSummary {
  itemId: string;
  totalReviews: number;
  keptCount: number;
  brokeCount: number;
}
