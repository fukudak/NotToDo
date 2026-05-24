import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
/** 今日の日付をYYYY-MM-DD形式で返す */
function todayString() {
    return new Date().toISOString().slice(0, 10);
}
const TARGET_DAYS_OPTIONS = [
    { value: 21, label: "21日（入門）", description: "シンプルな行動向け" },
    { value: 66, label: "66日（標準）", description: "Lally研究の平均値 ★推奨" },
    { value: 90, label: "90日（本格）", description: "複雑な習慣向け" },
];
export function AddItemForm({ onAdd, isAtLimit = false, maxItems, onNavigateToSettings }) {
    const [title, setTitle] = useState("");
    const [reason, setReason] = useState("");
    const [startDate, setStartDate] = useState(todayString());
    const [targetDays, setTargetDays] = useState(66);
    const [customDays, setCustomDays] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const effectiveTargetDays = useCustom ? (parseInt(customDays, 10) || 66) : targetDays;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !reason.trim())
            return;
        setSubmitting(true);
        try {
            await onAdd(title.trim(), reason.trim(), startDate, effectiveTargetDays);
            setTitle("");
            setReason("");
            setStartDate(todayString());
            setTargetDays(66);
            setCustomDays("");
            setUseCustom(false);
        }
        finally {
            setSubmitting(false);
        }
    };
    if (isAtLimit) {
        return (_jsxs("div", { className: "add-item-form plan-limit-notice", children: [_jsxs("p", { className: "plan-limit-message", children: ["\u7121\u6599\u7248\u306F", maxItems, "\u4EF6\u307E\u3067\u3067\u3059"] }), _jsx("button", { type: "button", className: "btn-upgrade", onClick: onNavigateToSettings, children: "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9" })] }));
    }
    return (_jsxs("form", { className: "add-item-form", onSubmit: handleSubmit, children: [_jsx("h2", { className: "form-title", children: "\u3084\u3089\u306A\u3044\u3053\u3068\u3092\u8FFD\u52A0" }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "title", children: "\u3084\u3089\u306A\u3044\u3053\u3068" }), _jsx("input", { id: "title", type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u4F8B: \u6DF1\u591C\u306ESNS\u95B2\u89A7", required: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "reason", children: "\u306A\u305C\u3084\u3089\u306A\u3044\u304B" }), _jsx("textarea", { id: "reason", value: reason, onChange: (e) => setReason(e.target.value), placeholder: "\u4F8B: \u7761\u7720\u306E\u8CEA\u304C\u4E0B\u304C\u308B\u305F\u3081", required: true, rows: 2 })] }), _jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "start-date", children: "\u958B\u59CB\u65E5" }), _jsx("input", { id: "start-date", type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "target-days", children: "\u7FD2\u6163\u5316\u76EE\u6A19\u671F\u9593" }), _jsxs("div", { className: "target-days-options", children: [TARGET_DAYS_OPTIONS.map((opt) => (_jsxs("label", { className: `target-option ${!useCustom && targetDays === opt.value ? "selected" : ""}`, children: [_jsx("input", { type: "radio", name: "targetDays", value: opt.value, checked: !useCustom && targetDays === opt.value, onChange: () => { setTargetDays(opt.value); setUseCustom(false); } }), _jsx("span", { className: "option-label", children: opt.label }), _jsx("span", { className: "option-desc", children: opt.description })] }, opt.value))), _jsxs("label", { className: `target-option ${useCustom ? "selected" : ""}`, children: [_jsx("input", { type: "radio", name: "targetDays", checked: useCustom, onChange: () => setUseCustom(true) }), _jsx("span", { className: "option-label", children: "\u30AB\u30B9\u30BF\u30E0" }), useCustom && (_jsx("input", { type: "number", className: "custom-days-input", value: customDays, onChange: (e) => setCustomDays(e.target.value), placeholder: "\u65E5\u6570", min: 1, max: 365 }))] })] }), _jsx("p", { className: "science-note", children: "\u203B UCL Lally\u7814\u7A76(2010): \u7FD2\u6163\u5316\u306B\u306F\u5E73\u574766\u65E5\u304B\u304B\u308B\uFF08\u7BC4\u56F2: 18\u301C254\u65E5\uFF09" })] })] }), _jsx("button", { type: "submit", className: "btn-primary", disabled: submitting || !title.trim() || !reason.trim(), children: submitting ? "追加中..." : "追加する" })] }));
}
