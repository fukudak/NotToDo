import {
  attemptLabel,
  calcItemProgress,
  calcProgressPercent,
  getCurrentAttempt,
  getItemStartDate,
  getTargetDays,
  progressStageClass,
} from "../lib/itemProgress";
import { useState } from "react";
import { formatDisplayDate } from "../lib/dates";
import type { AdherenceSummary, NotToDoItem, ReviewRecord } from "../types";

interface ItemCardProps {
  item: NotToDoItem;
  summary: AdherenceSummary | undefined;
  reviews: ReviewRecord[];
  onDelete: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
}

export function ItemCard({ item, summary, reviews, onDelete, onRetry }: ItemCardProps) {
  const targetDays = getTargetDays(item);
  const currentAttempt = getCurrentAttempt(item);
  const progress = calcItemProgress(item, reviews);
  const remainingDays = Math.max(0, targetDays - progress.elapsedDays);
  const progressPercent = calcProgressPercent(item, progress.elapsedDays);
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

  const [isReasonOpen, setIsReasonOpen] = useState(false);

  return (
    <div className={`item-card status-${progress.status} ${stageClass}`.trim()}>
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

      <div className="reason-section">
        <button
          className="reason-toggle"
          onClick={() => setIsReasonOpen(!isReasonOpen)}
          aria-expanded={isReasonOpen}
        >
          理由 {isReasonOpen ? "−" : "+"}
        </button>
        {isReasonOpen && <p className="item-reason">{item.reason}</p>}
      </div>

      {progress.status === "achieved" && (
        <div className="achievement-badge">
          <span className="badge-icon">★</span>
          <span className="badge-text">習慣化達成！{targetDays}日間継続</span>
        </div>
      )}

      {progress.status === "failed" && (
        <div className="failed-notice">
          <span>破ってしまいましたが、諦めないで。</span>
          <button className="btn-retry" onClick={() => void onRetry(item.id)}>
            リトライする
          </button>
        </div>
      )}

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

      <div className="item-footer">
        <div className="review-info">
          {summary && summary.totalReviews > 0 ? (
            <span className="review-count">振り返り {summary.totalReviews}回</span>
          ) : (
            <span className="review-count muted">未レビュー</span>
          )}
          <span className="review-last-date">
            {lastReviewedAt
              ? `最終: ${formatDisplayDate(lastReviewedAt)}`
              : "まだ振り返りなし"}
          </span>
        </div>
        <div className="meta-info">
          <span className="item-date">作成: {formatDisplayDate(item.createdAt)}</span>
          <span className="item-date">開始: {formatDisplayDate(getItemStartDate(item))}</span>
        </div>
      </div>
    </div>
  );
}
