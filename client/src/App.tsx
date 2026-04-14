import { useState } from "react";
import { AddItemForm } from "./components/AddItemForm";
import { DataManager } from "./components/DataManager";
import { ItemList } from "./components/ItemList";
import { ReviewPanel } from "./components/ReviewPanel";
import { useItems } from "./hooks/useItems";
import { useReviews } from "./hooks/useReviews";

type Tab = "list" | "review";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [showAddForm, setShowAddForm] = useState(false);
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    addItem,
    removeItem,
    retryItem,
    refresh: refreshItems,
  } = useItems();
  const {
    reviews,
    summary,
    loading: reviewsLoading,
    error: reviewsError,
    addReview,
    refresh: refreshReviews,
  } = useReviews();

  /** インポート完了後に全データをリフレッシュする */
  const handleImportComplete = async () => {
    await Promise.all([refreshItems(), refreshReviews()]);
  };

  const handleAddItem = async (
    title: string,
    reason: string,
    startDate: string,
    targetDays: number,
  ) => {
    await addItem(title, reason, startDate, targetDays);
    await refreshReviews();
    setShowAddForm(false);
  };

  const handleDeleteItem = async (id: string) => {
    await removeItem(id);
    await refreshReviews();
  };

  const handleRetryItem = async (id: string) => {
    await retryItem(id);
    await refreshReviews();
  };

  const loading = itemsLoading || reviewsLoading;
  const error = itemsError ?? reviewsError;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">✗</span>
        </div>
        <div className="app-title-area">
          <h1 className="app-title">やらないことリスト</h1>
          <p className="app-subtitle">やらないと決めたことを、習慣化するまで管理しよう</p>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-button ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          リスト
        </button>
        <button
          className={`tab-button ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          振り返り
        </button>
      </nav>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-bar" />}

      <main className="app-main">
        {activeTab === "list" && (
          <>
            <button
              className="btn-add-toggle"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? "✕ キャンセル" : "+ やらないことを追加"}
            </button>
            {showAddForm && <AddItemForm onAdd={handleAddItem} />}
            <ItemList
              items={items}
              summaries={summary}
              reviews={reviews}
              onDelete={handleDeleteItem}
              onRetry={handleRetryItem}
            />
            <DataManager
              items={items}
              reviews={reviews}
              onImportComplete={handleImportComplete}
            />
          </>
        )}
        {activeTab === "review" && (
          <ReviewPanel items={items} reviews={reviews} onAddReview={addReview} />
        )}
      </main>
    </div>
  );
}
