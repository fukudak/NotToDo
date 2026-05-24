import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { AddItemForm } from "./components/AddItemForm";
import { DataManager } from "./components/DataManager";
import { ItemEditList } from "./components/ItemEditList";
import { ItemList } from "./components/ItemList";
import { ReviewPanel } from "./components/ReviewPanel";
import { UpgradePrompt } from "./components/UpgradePrompt";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useItems } from "./hooks/useItems";
import { usePlan } from "./hooks/usePlan";
import { useReviews } from "./hooks/useReviews";
function getOwnerId(userId) {
    return userId === "userB" ? "userB" : "userA";
}
function AppContent() {
    const { auth, switchUser, login, logout } = useAuth();
    const currentUser = auth.userId;
    const [activeTab, setActiveTab] = useState("list");
    const [showAddForm, setShowAddForm] = useState(false);
    const { items, loading: itemsLoading, error: itemsError, addItem, removeItem, retryItem, editItem, refresh: refreshItems, } = useItems();
    const { reviews, summary, loading: reviewsLoading, error: reviewsError, addReview, refresh: refreshReviews, } = useReviews();
    const { plan, loading: planLoading } = usePlan(currentUser);
    const visibleItems = items.filter((item) => getOwnerId(item.userId) === currentUser);
    const visibleReviews = reviews.filter((review) => {
        if (review.userId)
            return review.userId === currentUser;
        const relatedItem = items.find((item) => item.id === review.itemId);
        return getOwnerId(relatedItem?.userId) === currentUser;
    });
    const visibleSummaries = summary.filter((entry) => {
        const relatedItem = items.find((item) => item.id === entry.itemId);
        return getOwnerId(relatedItem?.userId) === currentUser;
    });
    const handleImportComplete = async () => {
        await Promise.all([refreshItems(), refreshReviews()]);
    };
    const handleAddItem = async (title, reason, startDate, targetDays) => {
        await addItem(title, reason, startDate, targetDays, currentUser);
        await refreshReviews();
        setShowAddForm(false);
    };
    const handleDeleteItem = async (id) => {
        await removeItem(id);
        await refreshReviews();
    };
    const handleRetryItem = async (id) => {
        await retryItem(id);
        await refreshReviews();
    };
    const maxItems = plan?.maxItems ?? 3;
    const isAtLimit = visibleItems.length >= maxItems;
    const loading = itemsLoading || reviewsLoading;
    const error = itemsError ?? reviewsError;
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("div", { className: "app-logo", children: _jsx("span", { className: "logo-icon", children: "\u2717" }) }), _jsxs("div", { className: "app-title-area", children: [_jsx("h1", { className: "app-title", children: "\u3084\u3089\u306A\u3044\u3053\u3068\u30EA\u30B9\u30C8" }), _jsx("p", { className: "app-subtitle", children: "\u3084\u3089\u306A\u3044\u3068\u6C7A\u3081\u305F\u3053\u3068\u3092\u3001\u7FD2\u6163\u5316\u3059\u308B\u307E\u3067\u7BA1\u7406\u3057\u3088\u3046" }), _jsxs("p", { className: "app-user-indicator", children: ["\u73FE\u5728\u306E\u30E6\u30FC\u30B6\u30FC: ", currentUser] }), _jsxs("div", { className: "user-switcher", "aria-label": "\u30E6\u30FC\u30B6\u30FC\u5207\u308A\u66FF\u3048", children: [_jsx("button", { type: "button", className: "user-switch-button", onClick: () => switchUser("userA"), children: "userA" }), _jsx("button", { type: "button", className: "user-switch-button", onClick: () => switchUser("userB"), children: "userB" })] })] })] }), _jsxs("nav", { className: "tab-nav", role: "tablist", "aria-label": "\u753B\u9762\u5207\u308A\u66FF\u3048", children: [_jsx("button", { role: "tab", "aria-selected": activeTab === "list", "aria-controls": "panel-list", id: "tab-list", className: `tab-button ${activeTab === "list" ? "active" : ""}`, onClick: () => setActiveTab("list"), children: "\u30EA\u30B9\u30C8" }), _jsx("button", { role: "tab", "aria-selected": activeTab === "review", "aria-controls": "panel-review", id: "tab-review", className: `tab-button ${activeTab === "review" ? "active" : ""}`, onClick: () => setActiveTab("review"), children: "\u632F\u308A\u8FD4\u308A" }), _jsx("button", { role: "tab", "aria-selected": activeTab === "edit", "aria-controls": "panel-edit", id: "tab-edit", className: `tab-button ${activeTab === "edit" ? "active" : ""}`, onClick: () => setActiveTab("edit"), children: "\u7DE8\u96C6" }), _jsx("button", { role: "tab", "aria-selected": activeTab === "settings", "aria-controls": "panel-settings", id: "tab-settings", className: `tab-button ${activeTab === "settings" ? "active" : ""}`, onClick: () => setActiveTab("settings"), children: "\u8A2D\u5B9A" })] }), error && _jsx("div", { className: "error-banner", children: error }), loading && _jsx("div", { className: "loading-bar" }), _jsxs("main", { className: "app-main", children: [activeTab === "list" && (_jsxs("section", { id: "panel-list", "aria-labelledby": "tab-list", children: [_jsx("button", { className: "btn-add-toggle", onClick: () => setShowAddForm((v) => !v), children: showAddForm ? "✕ キャンセル" : "+ やらないことを追加" }), showAddForm && (_jsx(AddItemForm, { onAdd: handleAddItem, isAtLimit: isAtLimit, maxItems: maxItems, onNavigateToSettings: () => setActiveTab("settings") })), _jsx(ItemList, { items: visibleItems, summaries: visibleSummaries, reviews: visibleReviews, onDelete: handleDeleteItem, onRetry: handleRetryItem }), _jsx(DataManager, { items: visibleItems, reviews: visibleReviews, currentUser: currentUser, onImportComplete: handleImportComplete })] })), activeTab === "review" && (_jsx("section", { id: "panel-review", "aria-labelledby": "tab-review", children: _jsx(ReviewPanel, { items: visibleItems, reviews: visibleReviews, onAddReview: (itemId, adherence, reflection) => addReview(itemId, adherence, reflection, currentUser) }) })), activeTab === "edit" && (_jsx("section", { id: "panel-edit", "aria-labelledby": "tab-edit", children: _jsx(ItemEditList, { items: visibleItems, onEdit: editItem, onDelete: handleDeleteItem }) })), activeTab === "settings" && (_jsxs("section", { id: "panel-settings", "aria-labelledby": "tab-settings", children: [_jsxs("div", { className: "settings-panel", children: [_jsx("h2", { children: "\u8A2D\u5B9A" }), _jsxs("div", { className: "account-info", children: [_jsx("h3", { children: "\u30A2\u30AB\u30A6\u30F3\u30C8" }), auth.mode === "local" ? (_jsxs(_Fragment, { children: [_jsx("p", { children: "\u30ED\u30FC\u30AB\u30EB\u30E6\u30FC\u30B6\u30FC\u3067\u3059" }), _jsx("button", { type: "button", onClick: () => login("google"), children: "\u30ED\u30B0\u30A4\u30F3" })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { children: auth.mode === "authenticated" && (auth.email ?? auth.userId) }), _jsx("button", { type: "button", onClick: logout, children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] }))] }), _jsxs("div", { className: "plan-info", children: [_jsx("h3", { children: "\u30D7\u30E9\u30F3" }), planLoading ? (_jsx("p", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u73FE\u5728\u306E\u30D7\u30E9\u30F3: ", plan?.plan ?? "free"] }), _jsxs("p", { children: ["\u30A2\u30A4\u30C6\u30E0\u6570: ", visibleItems.length, " / ", maxItems] })] }))] })] }), !planLoading && _jsx(UpgradePrompt, { plan: plan?.plan ?? "free" })] }))] })] }));
}
export function App() {
    return (_jsx(AuthProvider, { children: _jsx(AppContent, {}) }));
}
