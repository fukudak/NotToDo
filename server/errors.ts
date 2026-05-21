/**
 * アプリケーション共通エラークラス。
 * すべての API エラーはここで定義したクラスに統一し、
 * server/index.ts のグローバルエラーハンドラーで HTTP レスポンスに変換する。
 */

/**
 * 基底エラークラス。
 * @param statusCode - HTTP ステータスコード
 * @param code - クライアントが判別するためのエラーコード
 * @param message - エラーメッセージ
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 入力値バリデーションエラー（HTTP 400）。
 * Zod スキーマ検証失敗時に使用する。
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

/**
 * リソース未検出エラー（HTTP 404）。
 * 指定 ID のアイテムが見つからない場合に使用する。
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/**
 * アクセス権限エラー（HTTP 403）。
 * 他ユーザーのリソースを操作しようとした場合に使用する。
 */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}
