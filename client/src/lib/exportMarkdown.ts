import type { NotToDoItem, ReviewRecord } from "../types";

/** 日付文字列をYYYY/MM/DD形式に変換する */
function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "/");
}

/** 開始日からの経過日数を計算する */
function calcElapsedDays(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** アイテム1件分のMarkdownを生成する */
function renderItemMarkdown(item: NotToDoItem, reviews: ReviewRecord[]): string {
  const targetDays = item.targetDays ?? 66;
  const currentAttempt = item.currentAttempt ?? 1;
  const startDate = item.startDate ?? item.createdAt.slice(0, 10);
  const elapsed = calcElapsedDays(startDate);
  const percent = Math.min(100, Math.round((elapsed / targetDays) * 100));

  const currentReviews = reviews.filter(
    (r) => r.itemId === item.id && (r.attemptNumber ?? 1) === currentAttempt,
  );
  const hasBroke = currentReviews.some((r) => r.adherence === "broke");
  const status = hasBroke ? "失敗" : elapsed >= targetDays ? "習慣化達成" : "継続中";

  let md = `## ${item.title}\n`;
  md += `**理由**: ${item.reason}  \n`;
  md += `**開始日**: ${formatDate(startDate)}  \n`;
  md += `**目標**: ${targetDays}日  \n`;
  md += `**進捗**: ${elapsed}/${targetDays}日（${percent}%）  \n`;
  md += `**状態**: ${status}  \n`;
  if (currentAttempt > 1) {
    md += `**試み**: ${currentAttempt}回目  \n`;
  }

  if (currentReviews.length > 0) {
    md += `\n### 振り返り履歴（第${currentAttempt}回目の挑戦）\n`;
    md += `| 日付 | 結果 | コメント |\n`;
    md += `|------|------|--------|\n`;
    for (const review of [...currentReviews].sort(
      (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    )) {
      const label = review.adherence === "kept" ? "守れた" : "破った";
      md += `| ${formatDate(review.reviewedAt)} | ${label} | ${review.reflection.replace(/\|/g, "｜")} |\n`;
    }
  }

  md += `\n---\n`;
  return md;
}

/** バックアップデータをMarkdown文字列に変換する */
export function generateMarkdown(items: NotToDoItem[], reviews: ReviewRecord[]): string {
  const today = formatDate(new Date().toISOString());
  let md = `# やらないことリスト バックアップ\n`;
  md += `エクスポート日: ${today}\n\n`;

  if (items.length === 0) {
    md += `_まだアイテムがありません。_\n\n`;
  } else {
    for (const item of items) {
      md += renderItemMarkdown(item, reviews);
      md += "\n";
    }
  }

  // 機械読み込み用のJSONをコメントに埋め込む
  const backupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    items,
    reviews,
  };
  md += `<!--BACKUP_DATA\n${JSON.stringify(backupData, null, 2)}\n-->\n`;

  return md;
}

/** MarkdownをファイルとしてダウンロードするDOMトリガー */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
