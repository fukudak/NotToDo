import { type FormEvent, useState } from "react";
import type { NotToDoItem, ReviewRecord } from "../types";

interface ReviewPanelProps {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
  onAddReview: (itemId: string, adherence: "kept" | "broke", reflection: string) => Promise<void>;
}

export function ReviewPanel({ items, reviews, onAddReview }: ReviewPanelProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [adherence, setAdherence] = useState<"kept" | "broke">("kept");
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !reflection.trim()) return;
    setSubmitting(true);
    try {
      await onAddReview(selectedItemId, adherence, reflection.trim());
      setReflection("");
      setSelectedItemId("");
      setAdherence("kept");
    } finally {
      setSubmitting(false);
    }
  };

  /** 最近のレビューを新しい順で表示 */
  const recentReviews = [...reviews].sort(
    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
  ).slice(0, 10);

  /** アイテムIDから名前を引く */
  const getItemTitle = (itemId: string): string => {
    return items.find((item) => item.id === itemId)?.title ?? "（削除済み）";
  };

  return (
    <div className="review-panel">
      <h2>振り返り</h2>

      {items.length === 0 ? (
        <p className="empty-state">振り返り対象のアイテムがありません。</p>
      ) : (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="review-item">対象のアイテム</label>
            <select
              id="review-item"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              <option value="">選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>守れましたか？</label>
            <div className="radio-group">
              <label className={`radio-label ${adherence === "kept" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="adherence"
                  value="kept"
                  checked={adherence === "kept"}
                  onChange={() => setAdherence("kept")}
                />
                守れた
              </label>
              <label className={`radio-label ${adherence === "broke" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="adherence"
                  value="broke"
                  checked={adherence === "broke"}
                  onChange={() => setAdherence("broke")}
                />
                破ってしまった
              </label>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="reflection">振り返りコメント</label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="どうだったか、次はどうするか"
              required
              rows={3}
            />
          </div>

          <button type="submit" disabled={submitting || !selectedItemId || !reflection.trim()}>
            {submitting ? "記録中..." : "記録する"}
          </button>
        </form>
      )}

      {recentReviews.length > 0 && (
        <div className="review-history">
          <h3>最近の振り返り</h3>
          <div className="timeline">
            {recentReviews.map((review, index) => (
              <div key={review.id} className={`timeline-item ${review.adherence}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="review-item-name">{getItemTitle(review.itemId)}</span>
                    <span className={`review-badge ${review.adherence}`}>
                      {review.adherence === "kept" ? "守れた" : "破った"}
                    </span>
                  </div>
                  <p className="review-reflection">{review.reflection}</p>
                  <span className="review-date">
                    {new Date(review.reviewedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
