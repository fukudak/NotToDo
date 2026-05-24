import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { downloadMarkdown, generateMarkdown } from "../lib/exportMarkdown";
import { parseBackupFile } from "../lib/importMarkdown";
import * as storage from "../lib/storage";
export function DataManager({ items, reviews, currentUser, onImportComplete }) {
    const [importing, setImporting] = useState(false);
    const [jsonImporting, setJsonImporting] = useState(false);
    const [jsonPreview, setJsonPreview] = useState(null);
    const [message, setMessage] = useState(null);
    const fileInputRef = useRef(null);
    const jsonFileInputRef = useRef(null);
    // Markdownとしてバックアップをダウンロード
    const handleExport = () => {
        const content = generateMarkdown(items, reviews);
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(content, `not-to-do-${date}.md`);
        setMessage({ type: "success", text: "バックアップを保存しました" });
        setTimeout(() => setMessage(null), 3000);
    };
    // JSONとしてエクスポート（storage.exportAll を使用）
    const handleJsonExport = () => {
        const json = storage.exportAll();
        const blob = new Blob([json], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `not-to-do-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    // JSONファイルを選択してプレビューを表示
    const handleJsonFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!Array.isArray(data.items) || !Array.isArray(data.reviews)) {
                throw new Error("不正なJSONフォーマットです");
            }
            setJsonPreview({
                items: data.items,
                reviews: data.reviews,
            });
            setMessage(null);
        }
        catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "JSONの読み込みに失敗しました",
            });
        }
    };
    // プレビュー確認後にJSONインポートを実行
    const handleJsonImport = async () => {
        if (!jsonPreview)
            return;
        const confirmed = window.confirm("既存のデータに追加します。続けますか？");
        if (!confirmed)
            return;
        setJsonImporting(true);
        try {
            // currentUserのuserIdを付与してインポート
            const importItems = jsonPreview.items.map((item) => ({ ...item, userId: currentUser }));
            const importReviews = jsonPreview.reviews.map((review) => ({
                ...review,
                userId: currentUser,
            }));
            const result = storage.importAll(JSON.stringify({ items: importItems, reviews: importReviews }));
            await onImportComplete();
            setJsonPreview(null);
            if (jsonFileInputRef.current) {
                jsonFileInputRef.current.value = "";
            }
            setMessage({
                type: "success",
                text: `インポート完了: アイテム ${result.importedItems}件、レビュー ${result.importedReviews}件`,
            });
        }
        catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "インポートに失敗しました",
            });
        }
        finally {
            setJsonImporting(false);
        }
    };
    // MarkdownまたはJSONファイルからインポート
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setImporting(true);
        setMessage(null);
        try {
            const text = await file.text();
            const backup = parseBackupFile(text, file.name);
            const result = storage.importAll(JSON.stringify({ items: backup.items, reviews: backup.reviews }));
            await onImportComplete();
            setMessage({
                type: "success",
                text: `インポート完了: アイテム ${result.importedItems}件、レビュー ${result.importedReviews}件`,
            });
        }
        catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "インポートに失敗しました",
            });
        }
        finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    return (_jsxs("div", { className: "data-manager", children: [_jsxs("div", { className: "data-manager-buttons", children: [_jsx("button", { className: "btn-data", onClick: handleExport, disabled: items.length === 0, title: items.length === 0 ? "アイテムがありません" : undefined, children: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u4FDD\u5B58" }), _jsx("button", { className: "btn-data", onClick: handleJsonExport, children: "\uD83D\uDCE5 \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8" }), _jsxs("label", { className: `btn-data btn-data-import ${importing ? "disabled" : ""}`, children: [importing ? "読み込み中..." : "バックアップを読み込む", _jsx("input", { ref: fileInputRef, type: "file", accept: ".md,.json", onChange: handleFileChange, disabled: importing, style: { display: "none" } })] }), _jsxs("label", { className: "btn-data btn-data-import", children: ["\uD83D\uDCE4 \u30A4\u30F3\u30DD\u30FC\u30C8\uFF08JSON\uFF09", _jsx("input", { ref: jsonFileInputRef, "data-testid": "json-import-input", type: "file", accept: ".json", onChange: handleJsonFileChange, style: { display: "none" } })] })] }), jsonPreview && (_jsxs("div", { className: "json-import-preview", children: [_jsxs("p", { children: ["\u30A2\u30A4\u30C6\u30E0\u6570: ", jsonPreview.items.length, "\u4EF6"] }), _jsxs("p", { children: ["\u30EC\u30D3\u30E5\u30FC\u6570: ", jsonPreview.reviews.length, "\u4EF6"] }), _jsx("button", { className: "btn-data", onClick: handleJsonImport, disabled: jsonImporting, children: jsonImporting ? "インポート中..." : "インポート実行" })] })), message && (_jsx("p", { className: `data-manager-message ${message.type}`, children: message.text }))] }));
}
