import { useState } from "react";
import type { NotToDoItem } from "../types";

interface ItemEditListProps {
  items: NotToDoItem[];
  onEdit: (
    id: string,
    data: { title?: string; reason?: string; completedAt?: string | null },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ItemEditList({ items, onEdit, onDelete }: ItemEditListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editReason, setEditReason] = useState("");

  const startEdit = (item: NotToDoItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditReason(item.reason);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (item: NotToDoItem) => {
    await onEdit(item.id, { title: editTitle, reason: editReason });
    setEditingId(null);
  };

  const markCompleted = async (id: string) => {
    await onEdit(id, { completedAt: new Date().toISOString() });
    setEditingId(null);
  };

  const clearCompleted = async (id: string) => {
    await onEdit(id, { completedAt: null });
    setEditingId(null);
  };

  if (items.length === 0) {
    return <p className="empty-edit">アイテムがありません</p>;
  }

  return (
    <div className="item-edit-list">
      {items.map((item) =>
        editingId === item.id ? (
          <div key={item.id} className="item-edit-form">
            <label htmlFor={`edit-title-${item.id}`}>タイトル</label>
            <input
              id={`edit-title-${item.id}`}
              type="text"
              aria-label="タイトル"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <label htmlFor={`edit-reason-${item.id}`}>理由</label>
            <input
              id={`edit-reason-${item.id}`}
              type="text"
              aria-label="理由"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
            <div className="edit-actions">
              <button type="button" onClick={() => void saveEdit(item)}>
                保存
              </button>
              <button type="button" onClick={cancelEdit}>
                キャンセル
              </button>
              {item.completedAt ? (
                <button type="button" onClick={() => void clearCompleted(item.id)}>
                  完了を取り消す
                </button>
              ) : (
                <button type="button" onClick={() => void markCompleted(item.id)}>
                  完了にする
                </button>
              )}
              <button
                type="button"
                className="btn-danger"
                onClick={() => void onDelete(item.id)}
                aria-label={`${item.title}を削除`}
              >
                削除
              </button>
            </div>
          </div>
        ) : (
          <div key={item.id} className="item-edit-row">
            <span className="item-edit-title">{item.title}</span>
            {item.completedAt && <span className="completed-badge">✓ 完了</span>}
            <button
              type="button"
              aria-label={`${item.title}を編集`}
              onClick={() => startEdit(item)}
            >
              編集
            </button>
          </div>
        ),
      )}
    </div>
  );
}
