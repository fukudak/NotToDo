import type { AdherenceSummary, NotToDoItem, ReviewRecord } from "../types";
import { ItemCard } from "./ItemCard";

interface ItemListProps {
  items: NotToDoItem[];
  summaries: AdherenceSummary[];
  reviews: ReviewRecord[];
  onDelete: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
}

export function ItemList({ items, summaries, reviews, onDelete, onRetry }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✓</div>
        <p className="empty-title">「やらないこと」はまだありません</p>
        <p className="empty-desc">上のフォームから追加しましょう。</p>
      </div>
    );
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          summary={summaries.find((s) => s.itemId === item.id)}
          reviews={reviews}
          onDelete={onDelete}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
