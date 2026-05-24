import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ItemEditList({ items, onEdit, onDelete }) {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editReason, setEditReason] = useState("");
    const startEdit = (item) => {
        setEditingId(item.id);
        setEditTitle(item.title);
        setEditReason(item.reason);
    };
    const cancelEdit = () => setEditingId(null);
    const saveEdit = async (item) => {
        await onEdit(item.id, { title: editTitle, reason: editReason });
        setEditingId(null);
    };
    const markCompleted = async (id) => {
        await onEdit(id, { completedAt: new Date().toISOString() });
        setEditingId(null);
    };
    const clearCompleted = async (id) => {
        await onEdit(id, { completedAt: null });
        setEditingId(null);
    };
    if (items.length === 0) {
        return _jsx("p", { className: "empty-edit", children: "\u30A2\u30A4\u30C6\u30E0\u304C\u3042\u308A\u307E\u305B\u3093" });
    }
    return (_jsx("div", { className: "item-edit-list", children: items.map((item) => editingId === item.id ? (_jsxs("div", { className: "item-edit-form", children: [_jsx("label", { htmlFor: `edit-title-${item.id}`, children: "\u30BF\u30A4\u30C8\u30EB" }), _jsx("input", { id: `edit-title-${item.id}`, type: "text", "aria-label": "\u30BF\u30A4\u30C8\u30EB", value: editTitle, onChange: (e) => setEditTitle(e.target.value) }), _jsx("label", { htmlFor: `edit-reason-${item.id}`, children: "\u7406\u7531" }), _jsx("input", { id: `edit-reason-${item.id}`, type: "text", "aria-label": "\u7406\u7531", value: editReason, onChange: (e) => setEditReason(e.target.value) }), _jsxs("div", { className: "edit-actions", children: [_jsx("button", { type: "button", onClick: () => void saveEdit(item), children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: cancelEdit, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), item.completedAt ? (_jsx("button", { type: "button", onClick: () => void clearCompleted(item.id), children: "\u5B8C\u4E86\u3092\u53D6\u308A\u6D88\u3059" })) : (_jsx("button", { type: "button", onClick: () => void markCompleted(item.id), children: "\u5B8C\u4E86\u306B\u3059\u308B" })), _jsx("button", { type: "button", className: "btn-danger", onClick: () => void onDelete(item.id), "aria-label": `${item.title}を削除`, children: "\u524A\u9664" })] })] }, item.id)) : (_jsxs("div", { className: "item-edit-row", children: [_jsx("span", { className: "item-edit-title", children: item.title }), item.completedAt && _jsx("span", { className: "completed-badge", children: "\u2713 \u5B8C\u4E86" }), _jsx("button", { type: "button", "aria-label": `${item.title}を編集`, onClick: () => startEdit(item), children: "\u7DE8\u96C6" })] }, item.id))) }));
}
