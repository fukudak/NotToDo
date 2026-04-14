/** やらないことアイテム */
export interface NotToDoItem {
  id: string;
  title: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  /** この試みの開始日 (YYYY-MM-DD) */
  startDate: string;
  /** 習慣化目標日数 (Lally 2010: 平均66日) */
  targetDays: number;
  /** 現在の試み番号 (1始まり) */
  currentAttempt: number;
}

/** 振り返り記録 */
export interface ReviewRecord {
  id: string;
  itemId: string;
  adherence: "kept" | "broke";
  reflection: string;
  reviewedAt: string;
  /** 何回目の試みのレビューか */
  attemptNumber: number;
}

/** アイテムごとの遵守率サマリー */
export interface AdherenceSummary {
  itemId: string;
  totalReviews: number;
  keptCount: number;
  brokeCount: number;
}

/** アイテムの状態 */
export type ItemStatus = "ongoing" | "failed" | "achieved";

/** アイテムの進捗情報（クライアント計算） */
export interface ItemProgress {
  elapsedDays: number;
  status: ItemStatus;
  currentAttemptReviews: ReviewRecord[];
  hasBroke: boolean;
}
