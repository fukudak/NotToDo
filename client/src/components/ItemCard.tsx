import type { AdherenceSummary, ItemProgress, NotToDoItem, ReviewRecord } from "../types";

interface ItemCardProps {
  item: NotToDoItem;
  summary: AdherenceSummary | undefined;
  reviews: ReviewRecord[];
  onDelete: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
}

/** 開始日からの経過日数を計算する */
function calcElapsedDays(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  // 時刻を除いて日付のみで比較
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** アイテムの進捗情報を計算する */
function calcProgress(item: NotToDoItem, reviews: ReviewRecord[]): ItemProgress {
  const currentAttempt = item.currentAttempt ?? 1;
  const startDate = item.startDate ?? item.createdAt.slice(0, 10);
  const elapsedDays = calcElapsedDays(startDate);

  const currentAttemptReviews = reviews.filter(
    (r) => (r.attemptNumber ?? 1) === currentAttempt && r.itemId === item.id,
  );
  const hasBroke = currentAttemptReviews.some((r) => r.adherence === "broke");

  let status: ItemProgress["status"];
  if (hasBroke) {
    status = "failed";
  } else if (elapsedDays >= (item.targetDays ?? 66)) {
    status = "achieved";
  } else {
    status = "ongoing";
  }

  return { elapsedDays, status, currentAttemptReviews, hasBroke };
}

/** 試み番号を日本語で表示する */
function attemptLabel(n: number): string {
  if (n === 1) return "";
  return `${n}回目の挑戦`;
}

/** 進捗率から3段階のステージクラスを返す（failed/achievedは除く） */
function progressStageClass(percent: number, status: ItemProgress["status"]): string {
  if (status !== "ongoing") return "";
  if (percent >= 67) return "progress-stage-3";
  if (percent >= 34) return "progress-stage-2";
  return "progress-stage-1";
}

export function ItemCard({ item, summary, reviews, onDelete, onRetry }: ItemCardProps) {
  const targetDays = item.targetDays ?? 66;
  const currentAttempt = item.currentAttempt ?? 1;
  const progress = calcProgress(item, reviews);
  const remainingDays = Math.max(0, targetDays - progress.elapsedDays);
  const progressPercent = Math.min(100, Math.round((progress.elapsedDays / targetDays) * 100));
  const stageClass = progressStageClass(progressPercent, progress.status);
  const lastReviewedAt = reviews
    .filter((r) => r.itemId === item.id)
    .reduce<string | null>((latest, r) => (r.reviewedAt > (latest ?? "") ? r.reviewedAt : latest), null)
    ?.slice(0, 10);
  const progressLabel =
    progress.status === "achieved"
      ? "達成済み"
      : progress.status === "failed"
        ? "今回の試みは失敗"
        : `あと${remainingDays}日`;

  return (
    <div className={`item-card status-${progress.status} ${stageClass}`.trim()}>
      {/* ヘッダー */}
      <div className="item-header">
        <div className="item-title-area">
          {currentAttempt > 1 && (
            <span className="attempt-badge">{attemptLabel(currentAttempt)}</span>
          )}
          <h3 className="item-title">{item.title}</h3>
          {item.completedAt && <span className="completed-badge">✓ 完了</span>}
        </div>
        <button
          className="btn-icon"
          onClick={() => void onDelete(item.id)}
          aria-label={`${item.title}を削除`}
          title="削除"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
          </svg>
        </button>
      </div>

      {/* 理由 */}
      <p className="item-reason">{item.reason}</p>

      {/* 達成バッジ */}
      {progress.status === "achieved" && (
        <div className="achievement-badge">
          <span className="badge-icon">★</span>
          <span className="badge-text">習慣化達成！{targetDays}日間継続</span>
        </div>
      )}

      {/* 失敗メッセージ */}
      {progress.status === "failed" && (
        <div className="failed-notice">
          <span>破ってしまいましたが、諦めないで。</span>
          <button
            className="btn-retry"
            onClick={() => void onRetry(item.id)}
          >
            リトライする
          </button>
        </div>
      )}

      {/* 進捗バー */}
      {progress.status !== "achieved" && (
        <div className="progress-section">
          <div className="progress-labels">
            <span className="progress-days">
              {progress.elapsedDays} / {targetDays}日
            </span>
            <span className="progress-percent">{progressPercent}%</span>
          </div>
          <div className="progress-meta">{progressLabel}</div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${progress.status}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="item-footer">
        <div className="review-info">
          {summary && summary.totalReviews > 0 ? (
            <span className="review-count">振り返り {summary.totalReviews}回</span>
          ) : (
            <span className="review-count muted">未レビュー</span>
          )}
          <span className="review-last-date">
            {lastReviewedAt
              ? `最終: ${lastReviewedAt.replace(/-/g, "/")}`
              : "まだ振り返りなし"}
          </span>
        </div>
        <span className="item-date">
          開始: {(item.startDate ?? item.createdAt.slice(0, 10)).replace(/-/g, "/")}
        </span>
      </div>
    </div>
  );
}
