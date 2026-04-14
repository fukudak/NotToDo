/** 開始日からの経過日数を計算する（時刻を除いた日付のみで比較） */
export function calcElapsedDays(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** 日付文字列をYYYY/MM/DD形式に変換する */
export function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "/");
}
