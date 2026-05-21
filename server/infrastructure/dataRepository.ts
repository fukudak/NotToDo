/**
 * アイテム・レビューデータの JSON ファイル永続化層。
 * アトミックな書き込みのため一時ファイル経由でリネームする。
 */
import { join } from "path";
import { NotToDoData } from "../domain/types.ts";

const DATA_DIR = join(import.meta.dir, "../../data");
const DATA_FILE = join(DATA_DIR, "not-to-do-items.json");

/** 空のデータ構造を返す（ファイル未作成時の初期値） */
function createEmptyData(): NotToDoData {
  return { items: [], reviews: [] };
}

/**
 * データファイルを読み込む。ファイルが存在しない場合は空のデータを返す。
 * @returns 保存されているデータ（items・reviews）
 */
export async function readData(): Promise<NotToDoData> {
  const file = Bun.file(DATA_FILE);
  const exists = await file.exists();
  if (!exists) {
    return createEmptyData();
  }
  const text = await file.text();
  return JSON.parse(text) as NotToDoData;
}

/**
 * データファイルにアトミックに書き込む。
 * 一時ファイルに書いてからリネームすることで、
 * 書き込み途中のクラッシュによるデータ破損を防ぐ。
 * @param data - 書き込むデータ
 */
export async function writeData(data: NotToDoData): Promise<void> {
  const fs = await import("fs/promises");
  // data ディレクトリがなければ作成（初回起動時）
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Bun.write(join(DATA_DIR, ".not-to-do-items.tmp.json"), JSON.stringify(data, null, 2));
  await fs.rename(
    join(DATA_DIR, ".not-to-do-items.tmp.json"),
    DATA_FILE,
  );
}
