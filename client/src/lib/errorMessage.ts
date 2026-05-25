/** 未知の例外をユーザー向けメッセージに変換する */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "不明なエラー";
}
