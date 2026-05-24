import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** 開始日からの経過日数を計算する */
function calcElapsedDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    // 時刻を除いて日付のみで比較
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
/** アイテムの進捗情報を計算する */
function calcProgress(item, reviews) {
    const currentAttempt = item.currentAttempt ?? 1;
    const startDate = item.startDate ?? item.createdAt.slice(0, 10);
    const elapsedDays = calcElapsedDays(startDate);
    const currentAttemptReviews = reviews.filter((r) => (r.attemptNumber ?? 1) === currentAttempt && r.itemId === item.id);
    const hasBroke = currentAttemptReviews.some((r) => r.adherence === "broke");
    let status;
    if (hasBroke) {
        status = "failed";
    }
    else if (elapsedDays >= (item.targetDays ?? 66)) {
        status = "achieved";
    }
    else {
        status = "ongoing";
    }
    return { elapsedDays, status, currentAttemptReviews, hasBroke };
}
/** 試み番号を日本語で表示する */
function attemptLabel(n) {
    if (n === 1)
        return "";
    return `${n}回目の挑戦`;
}
/** 進捗率から3段階のステージクラスを返す（failed/achievedは除く） */
function progressStageClass(percent, status) {
    if (status !== "ongoing")
        return "";
    if (percent >= 67)
        return "progress-stage-3";
    if (percent >= 34)
        return "progress-stage-2";
    return "progress-stage-1";
}
export function ItemCard({ item, summary, reviews, onDelete, onRetry }) {
    const targetDays = item.targetDays ?? 66;
    const currentAttempt = item.currentAttempt ?? 1;
    const progress = calcProgress(item, reviews);
    const remainingDays = Math.max(0, targetDays - progress.elapsedDays);
    const progressPercent = Math.min(100, Math.round((progress.elapsedDays / targetDays) * 100));
    const stageClass = progressStageClass(progressPercent, progress.status);
    const lastReviewedAt = reviews
        .filter((r) => r.itemId === item.id)
        .reduce((latest, r) => (r.reviewedAt > (latest ?? "") ? r.reviewedAt : latest), null)
        ?.slice(0, 10);
    const progressLabel = progress.status === "achieved"
        ? "達成済み"
        : progress.status === "failed"
            ? "今回の試みは失敗"
            : `あと${remainingDays}日`;
    return (_jsxs("div", { className: `item-card status-${progress.status} ${stageClass}`.trim(), children: [_jsxs("div", { className: "item-header", children: [_jsxs("div", { className: "item-title-area", children: [currentAttempt > 1 && (_jsx("span", { className: "attempt-badge", children: attemptLabel(currentAttempt) })), _jsx("h3", { className: "item-title", children: item.title }), item.completedAt && _jsx("span", { className: "completed-badge", children: "\u2713 \u5B8C\u4E86" })] }), _jsx("button", { className: "btn-icon", onClick: () => void onDelete(item.id), "aria-label": `${item.title}を削除`, title: "\u524A\u9664", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" }) }) })] }), _jsx("p", { className: "item-reason", children: item.reason }), progress.status === "achieved" && (_jsxs("div", { className: "achievement-badge", children: [_jsx("span", { className: "badge-icon", children: "\u2605" }), _jsxs("span", { className: "badge-text", children: ["\u7FD2\u6163\u5316\u9054\u6210\uFF01", targetDays, "\u65E5\u9593\u7D99\u7D9A"] })] })), progress.status === "failed" && (_jsxs("div", { className: "failed-notice", children: [_jsx("span", { children: "\u7834\u3063\u3066\u3057\u307E\u3044\u307E\u3057\u305F\u304C\u3001\u8AE6\u3081\u306A\u3044\u3067\u3002" }), _jsx("button", { className: "btn-retry", onClick: () => void onRetry(item.id), children: "\u30EA\u30C8\u30E9\u30A4\u3059\u308B" })] })), progress.status !== "achieved" && (_jsxs("div", { className: "progress-section", children: [_jsxs("div", { className: "progress-labels", children: [_jsxs("span", { className: "progress-days", children: [progress.elapsedDays, " / ", targetDays, "\u65E5"] }), _jsxs("span", { className: "progress-percent", children: [progressPercent, "%"] })] }), _jsx("div", { className: "progress-meta", children: progressLabel }), _jsx("div", { className: "progress-bar-track", children: _jsx("div", { className: `progress-bar-fill ${progress.status}`, style: { width: `${progressPercent}%` } }) })] })), _jsxs("div", { className: "item-footer", children: [_jsxs("div", { className: "review-info", children: [summary && summary.totalReviews > 0 ? (_jsxs("span", { className: "review-count", children: ["\u632F\u308A\u8FD4\u308A ", summary.totalReviews, "\u56DE"] })) : (_jsx("span", { className: "review-count muted", children: "\u672A\u30EC\u30D3\u30E5\u30FC" })), _jsx("span", { className: "review-last-date", children: lastReviewedAt
                                    ? `最終: ${lastReviewedAt.replace(/-/g, "/")}`
                                    : "まだ振り返りなし" })] }), _jsxs("span", { className: "item-date", children: ["\u958B\u59CB: ", (item.startDate ?? item.createdAt.slice(0, 10)).replace(/-/g, "/")] })] })] }));
}
