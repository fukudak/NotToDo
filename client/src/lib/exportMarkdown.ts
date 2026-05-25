import type { NotToDoItem, ReviewRecord } from "../types";
import { formatDisplayDate } from "./dates";
import { downloadBlob } from "./downloadBlob";
import {
  calcItemProgress,
  calcProgressPercent,
  getCurrentAttempt,
  getItemStartDate,
  getTargetDays,
  statusLabel,
} from "./itemProgress";

/** アイテム1件分のMarkdownを生成する */
function renderItemMarkdown(item: NotToDoItem, reviews: ReviewRecord[]): string {
  const targetDays = getTargetDays(item);
  const currentAttempt = getCurrentAttempt(item);
  const startDate = getItemStartDate(item);
  const progress = calcItemProgress(item, reviews);
  const percent = calcProgressPercent(item, progress.elapsedDays);

  let md = `## ${item.title}\n`;
  md += `**理由**: ${item.reason}  \n`;
  md += `**開始日**: ${formatDisplayDate(startDate)}  \n`;
  md += `**目標**: ${targetDays}日  \n`;
  md += `**進捗**: ${progress.elapsedDays}/${targetDays}日（${percent}%）  \n`;
  md += `**状態**: ${statusLabel(progress.status)}  \n`;
  if (currentAttempt > 1) {
    md += `**試み**: ${currentAttempt}回目  \n`;
  }

  const currentReviews = progress.currentAttemptReviews;
  if (currentReviews.length > 0) {
    md += `\n### 振り返り履歴（第${currentAttempt}回目の挑戦）\n`;
    md += `| 日付 | 結果 | コメント |\n`;
    md += `|------|------|--------|\n`;
    for (const review of [...currentReviews].sort(
      (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    )) {
      const label = review.adherence === "kept" ? "守れた" : "破った";
      md += `| ${formatDisplayDate(review.reviewedAt)} | ${label} | ${review.reflection.replace(/\|/g, "｜")} |\n`;
    }
  }

  md += `\n---\n`;
  return md;
}

/** バックアップデータをMarkdown文字列に変換する */
export function generateMarkdown(items: NotToDoItem[], reviews: ReviewRecord[]): string {
  const today = formatDisplayDate(new Date().toISOString());
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

  const backupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    items,
    reviews,
  };
  md += `<!--BACKUP_DATA\n${JSON.stringify(backupData, null, 2)}\n-->\n`;

  return md;
}

/** Markdownをファイルとしてダウンロードする */
export function downloadMarkdown(content: string, filename: string): void {
  downloadBlob(content, filename, "text/markdown;charset=utf-8");
}
