/** リソースが見つからない場合のエラー */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource}が見つかりません: ${id}`);
    this.name = "NotFoundError";
  }
}

/** 入力値が不正な場合のエラー */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
