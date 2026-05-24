import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ReviewPanel({ items, reviews, onAddReview }) {
    const [selectedItemId, setSelectedItemId] = useState("");
    const [adherence, setAdherence] = useState("kept");
    const [reflection, setReflection] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItemId || !reflection.trim())
            return;
        setSubmitting(true);
        try {
            await onAddReview(selectedItemId, adherence, reflection.trim());
            setReflection("");
            setSelectedItemId("");
            setAdherence("kept");
        }
        finally {
            setSubmitting(false);
        }
    };
    /** 最近のレビューを新しい順で表示 */
    const recentReviews = [...reviews].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()).slice(0, 10);
    /** アイテムIDから名前を引く */
    const getItemTitle = (itemId) => {
        return items.find((item) => item.id === itemId)?.title ?? "（削除済み）";
    };
    return (_jsxs("div", { className: "review-panel", children: [_jsx("h2", { children: "\u632F\u308A\u8FD4\u308A" }), items.length === 0 ? (_jsx("p", { className: "empty-state", children: "\u632F\u308A\u8FD4\u308A\u5BFE\u8C61\u306E\u30A2\u30A4\u30C6\u30E0\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsxs("form", { className: "review-form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "review-item", children: "\u5BFE\u8C61\u306E\u30A2\u30A4\u30C6\u30E0" }), _jsxs("select", { id: "review-item", value: selectedItemId, onChange: (e) => setSelectedItemId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044" }), items.map((item) => (_jsx("option", { value: item.id, children: item.title }, item.id)))] })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "\u5B88\u308C\u307E\u3057\u305F\u304B\uFF1F" }), _jsxs("div", { className: "radio-group", children: [_jsxs("label", { className: `radio-label ${adherence === "kept" ? "selected" : ""}`, children: [_jsx("input", { type: "radio", name: "adherence", value: "kept", checked: adherence === "kept", onChange: () => setAdherence("kept") }), "\u5B88\u308C\u305F"] }), _jsxs("label", { className: `radio-label ${adherence === "broke" ? "selected" : ""}`, children: [_jsx("input", { type: "radio", name: "adherence", value: "broke", checked: adherence === "broke", onChange: () => setAdherence("broke") }), "\u7834\u3063\u3066\u3057\u307E\u3063\u305F"] })] })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "reflection", children: "\u632F\u308A\u8FD4\u308A\u30B3\u30E1\u30F3\u30C8" }), _jsx("textarea", { id: "reflection", value: reflection, onChange: (e) => setReflection(e.target.value), placeholder: "\u3069\u3046\u3060\u3063\u305F\u304B\u3001\u6B21\u306F\u3069\u3046\u3059\u308B\u304B", required: true, rows: 3 })] }), _jsx("button", { type: "submit", disabled: submitting || !selectedItemId || !reflection.trim(), children: submitting ? "記録中..." : "記録する" })] })), recentReviews.length > 0 && (_jsxs("div", { className: "review-history", children: [_jsx("h3", { children: "\u6700\u8FD1\u306E\u632F\u308A\u8FD4\u308A" }), recentReviews.map((review) => (_jsxs("div", { className: `review-record ${review.adherence}`, children: [_jsxs("div", { className: "review-header", children: [_jsx("span", { className: "review-item-name", children: getItemTitle(review.itemId) }), _jsx("span", { className: `review-badge ${review.adherence}`, children: review.adherence === "kept" ? "守れた" : "破った" })] }), _jsx("p", { className: "review-reflection", children: review.reflection }), _jsx("span", { className: "review-date", children: new Date(review.reviewedAt).toLocaleDateString("ja-JP") })] }, review.id)))] }))] }));
}
