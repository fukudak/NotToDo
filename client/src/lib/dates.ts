/** 今日の日付を YYYY-MM-DD 形式で返す */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO 日付文字列を YYYY/MM/DD 形式で表示する */
export function formatDisplayDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "/");
}

/** 開始日からの経過日数を計算する */
export function calcElapsedDays(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
