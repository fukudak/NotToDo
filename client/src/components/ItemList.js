import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ItemCard } from "./ItemCard";
export function ItemList({ items, summaries, reviews, onDelete, onRetry }) {
    if (items.length === 0) {
        return (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\u2713" }), _jsx("p", { className: "empty-title", children: "\u300C\u3084\u3089\u306A\u3044\u3053\u3068\u300D\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093" }), _jsx("p", { className: "empty-desc", children: "\u4E0A\u306E\u30D5\u30A9\u30FC\u30E0\u304B\u3089\u8FFD\u52A0\u3057\u307E\u3057\u3087\u3046\u3002" })] }));
    }
    return (_jsx("div", { className: "item-list", children: items.map((item) => (_jsx(ItemCard, { item: item, summary: summaries.find((s) => s.itemId === item.id), reviews: reviews, onDelete: onDelete, onRetry: onRetry }, item.id))) }));
}
