/**
 * MarkdownファイルからJSONバックアップを抽出してパースする。
 * `<!--BACKUP_DATA ... -->` コメント内のJSONを読み取る。
 */
function parseMarkdownBackup(text) {
    const match = text.match(/<!--BACKUP_DATA\n([\s\S]*?)\n-->/);
    if (!match?.[1]) {
        throw new Error("バックアップデータが見つかりません。このアプリでエクスポートしたMarkdownファイルを選択してください。");
    }
    return JSON.parse(match[1]);
}
/** JSONファイルをバックアップデータとしてパースする */
function parseJsonBackup(text) {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" ||
        parsed === null ||
        !("items" in parsed) ||
        !("reviews" in parsed) ||
        !Array.isArray(parsed.items) ||
        !Array.isArray(parsed.reviews)) {
        throw new Error("有効なバックアップJSONではありません。items と reviews フィールドが必要です。");
    }
    return parsed;
}
/** ファイルの拡張子に応じてMarkdownまたはJSONとしてパースする */
export function parseBackupFile(text, filename) {
    if (filename.endsWith(".md")) {
        return parseMarkdownBackup(text);
    }
    if (filename.endsWith(".json")) {
        return parseJsonBackup(text);
    }
    // 拡張子不明の場合はMarkdown→JSONの順で試みる
    try {
        return parseMarkdownBackup(text);
    }
    catch {
        return parseJsonBackup(text);
    }
}
/** 既存データとインポートデータをマージする（ID重複は上書き、新規IDは追加） */
export function mergeBackupData(existingItems, existingReviews, imported) {
    const itemMap = new Map(existingItems.map((i) => [i.id, i]));
    for (const item of imported.items) {
        itemMap.set(item.id, item);
    }
    const reviewMap = new Map(existingReviews.map((r) => [r.id, r]));
    for (const review of imported.reviews) {
        reviewMap.set(review.id, review);
    }
    return {
        items: Array.from(itemMap.values()),
        reviews: Array.from(reviewMap.values()),
    };
}
