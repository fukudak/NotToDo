import { useRef, useState } from "react";
import * as api from "../api/client";
import { downloadMarkdown, generateMarkdown } from "../lib/exportMarkdown";
import { parseBackupFile } from "../lib/importMarkdown";
import type { NotToDoItem, ReviewRecord } from "../types";

interface DataManagerProps {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
  currentUser: string;
  onImportComplete: () => Promise<void>;
}

export function DataManager({ items, reviews, currentUser, onImportComplete }: DataManagerProps) {
  const [importing, setImporting] = useState(false);
  const [jsonImporting, setJsonImporting] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<{
    items: NotToDoItem[];
    reviews: ReviewRecord[];
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const content = generateMarkdown(items, reviews);
    const date = new Date().toISOString().slice(0, 10);
    downloadMarkdown(content, `not-to-do-${date}.md`);
    setMessage({ type: "success", text: "バックアップを保存しました" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleJsonExport = () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      items,
      reviews,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `not-to-do-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as { items?: unknown; reviews?: unknown };
      if (!Array.isArray(data.items) || !Array.isArray(data.reviews)) {
        throw new Error("不正なJSONフォーマットです");
      }
      setJsonPreview({
        items: data.items as NotToDoItem[],
        reviews: data.reviews as ReviewRecord[],
      });
      setMessage(null);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "JSONの読み込みに失敗しました",
      });
    }
  };

  const handleJsonImport = async () => {
    if (!jsonPreview) return;
    const confirmed = window.confirm("既存のデータに追加します。続けますか？");
    if (!confirmed) return;

    setJsonImporting(true);
    try {
      const importItems = jsonPreview.items.map((item) => ({ ...item, userId: currentUser }));
      const importReviews = jsonPreview.reviews.map((review) => ({
        ...review,
        userId: currentUser,
      }));
      const result = await api.importBackup(importItems, importReviews);
      await onImportComplete();
      setJsonPreview(null);
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = "";
      }
      setMessage({
        type: "success",
        text: `インポート完了: アイテム ${result.importedItems}件、レビュー ${result.importedReviews}件`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "インポートに失敗しました",
      });
    } finally {
      setJsonImporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const backup = parseBackupFile(text, file.name);
      const result = await api.importBackup(backup.items, backup.reviews);
      await onImportComplete();
      setMessage({
        type: "success",
        text: `インポート完了: アイテム ${result.importedItems}件、レビュー ${result.importedReviews}件`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "インポートに失敗しました",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="data-manager">
      <div className="data-manager-buttons">
        <button
          className="btn-data"
          onClick={handleExport}
          disabled={items.length === 0}
          title={items.length === 0 ? "アイテムがありません" : undefined}
        >
          バックアップを保存
        </button>
        <button className="btn-data" onClick={handleJsonExport}>
          📥 エクスポート
        </button>
        <label className={`btn-data btn-data-import ${importing ? "disabled" : ""}`}>
          {importing ? "読み込み中..." : "バックアップを読み込む"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.json"
            onChange={handleFileChange}
            disabled={importing}
            style={{ display: "none" }}
          />
        </label>
        <label className="btn-data btn-data-import">
          📤 インポート（JSON）
          <input
            ref={jsonFileInputRef}
            data-testid="json-import-input"
            type="file"
            accept=".json"
            onChange={handleJsonFileChange}
            style={{ display: "none" }}
          />
        </label>
      </div>
      {jsonPreview && (
        <div className="json-import-preview">
          <p>アイテム数: {jsonPreview.items.length}件</p>
          <p>レビュー数: {jsonPreview.reviews.length}件</p>
          <button
            className="btn-data"
            onClick={handleJsonImport}
            disabled={jsonImporting}
          >
            {jsonImporting ? "インポート中..." : "インポート実行"}
          </button>
        </div>
      )}
      {message && (
        <p className={`data-manager-message ${message.type}`}>{message.text}</p>
      )}
    </div>
  );
}
