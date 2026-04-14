import { useRef, useState } from "react";
import * as api from "../api/client";
import { MAX_IMPORT_FILE_BYTES } from "../lib/constants";
import { downloadMarkdown, generateMarkdown } from "../lib/exportMarkdown";
import { parseBackupFile } from "../lib/importMarkdown";
import type { NotToDoItem, ReviewRecord } from "../types";

interface DataManagerProps {
  items: NotToDoItem[];
  reviews: ReviewRecord[];
  onImportComplete: () => Promise<void>;
}

export function DataManager({ items, reviews, onImportComplete }: DataManagerProps) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** バックアップをMarkdownファイルとしてダウンロードする */
  const handleExport = () => {
    const content = generateMarkdown(items, reviews);
    const date = new Date().toISOString().slice(0, 10);
    downloadMarkdown(content, `not-to-do-${date}.md`);
    setMessage({ type: "success", text: "バックアップを保存しました" });
    setTimeout(() => setMessage(null), 3000);
  };

  /** ファイルを選択してインポートする */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setMessage({ type: "error", text: "ファイルサイズが大きすぎます（上限: 10MB）" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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
      // ファイル選択をリセット（同じファイルを再度選択できるように）
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
      </div>
      {message && (
        <p className={`data-manager-message ${message.type}`}>{message.text}</p>
      )}
    </div>
  );
}
