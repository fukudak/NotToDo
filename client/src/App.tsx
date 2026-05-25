import { useState } from "react";
import { AddItemForm } from "./components/AddItemForm";
import { ItemEditList } from "./components/ItemEditList";
import { ItemList } from "./components/ItemList";
import { ReviewPanel } from "./components/ReviewPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useItems } from "./hooks/useItems";
import { usePlan } from "./hooks/usePlan";
import { useReviews } from "./hooks/useReviews";
import { isLocalStorageAvailable } from "./lib/localStorageAvailability";
import { APP_VERSION } from "./version";

type Tab = "list" | "review" | "edit" | "settings";

export function App() {
  const storageAvailable = isLocalStorageAvailable();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [showAddForm, setShowAddForm] = useState(false);

  const { items, error: itemsError, addItem, removeItem, retryItem, editItem, refresh: refreshItems } =
    useItems();
  const { reviews, summary, error: reviewsError, addReview, refresh: refreshReviews } = useReviews();
  const { plan } = usePlan();

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

  const maxItems = plan.maxItems;
  const isAtLimit = items.length >= maxItems;
  const error = itemsError ?? reviewsError;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-main">
          <div className="app-logo" aria-hidden="true">
            <span className="logo-icon">×</span>
          </div>
          <div className="app-title-area">
            <p className="app-eyebrow">Not To Do</p>
            <h1 className="app-title">やらないことリスト</h1>
            <p className="app-subtitle">やらないと決めたことを、習慣化するまで記録する</p>
          </div>
        </div>
        <p className="app-version-badge" aria-label={`バージョン ${APP_VERSION}`}>
          v{APP_VERSION}
        </p>
      </header>

      <nav className="tab-nav" role="tablist" aria-label="画面切り替え">
        <button
          role="tab"
          aria-selected={activeTab === "list"}
          aria-controls="panel-list"
          id="tab-list"
          className={`tab-button ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          リスト
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "review"}
          aria-controls="panel-review"
          id="tab-review"
          className={`tab-button ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          振り返り
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "edit"}
          aria-controls="panel-edit"
          id="tab-edit"
          className={`tab-button ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          編集
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "settings"}
          aria-controls="panel-settings"
          id="tab-settings"
          className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          設定
        </button>
      </nav>

      {error && <div className="error-banner">{error}</div>}
      {!storageAvailable && (
        <div className="storage-warning-banner" role="alert">
          このブラウザではデータを保存できません。プライベートブラウジングを解除するか、通常モードで開いてください。閉じると入力内容は失われます。
        </div>
      )}

      <main className="app-main">
        {activeTab === "list" && (
          <section id="panel-list" aria-labelledby="tab-list">
            <button className="btn-add-toggle" onClick={() => setShowAddForm((v) => !v)}>
              {showAddForm ? "✕ キャンセル" : "+ やらないことを追加"}
            </button>
            {showAddForm && (
              <AddItemForm
                onAdd={handleAddItem}
                isAtLimit={isAtLimit}
                maxItems={maxItems}
                onNavigateToSettings={() => setActiveTab("settings")}
              />
            )}
            <ItemList
              items={items}
              summaries={summary}
              reviews={reviews}
              onDelete={handleDeleteItem}
              onRetry={handleRetryItem}
            />
          </section>
        )}

        {activeTab === "review" && (
          <section id="panel-review" aria-labelledby="tab-review">
            <ReviewPanel
              items={items}
              reviews={reviews}
              onAddReview={(itemId, adherence, reflection) => addReview(itemId, adherence, reflection)}
            />
          </section>
        )}

        {activeTab === "edit" && (
          <section id="panel-edit" aria-labelledby="tab-edit">
            <ItemEditList items={items} onEdit={editItem} onDelete={handleDeleteItem} />
          </section>
        )}

        {activeTab === "settings" && (
          <section id="panel-settings" aria-labelledby="tab-settings">
            <SettingsPanel
              plan={plan}
              itemCount={items.length}
              items={items}
              reviews={reviews}
              onImportComplete={handleImportComplete}
            />
          </section>
        )}
      </main>
    </div>
  );
}
