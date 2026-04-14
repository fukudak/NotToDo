import { join } from "path";
import { NotToDoData } from "../domain/types.ts";

const DATA_DIR = join(import.meta.dir, "../../data");
const DATA_FILE = join(DATA_DIR, "not-to-do-items.json");

/** 空のデータ構造 */
function createEmptyData(): NotToDoData {
  return { items: [], reviews: [] };
}

/** データファイルを読み込む。ファイルが存在しない場合は空のデータを返す */
export async function readData(): Promise<NotToDoData> {
  const file = Bun.file(DATA_FILE);
  const exists = await file.exists();
  if (!exists) {
    return createEmptyData();
  }
  const text = await file.text();
  return JSON.parse(text) as NotToDoData;
}

/** データファイルにアトミックに書き込む（一時ファイル経由） */
export async function writeData(data: NotToDoData): Promise<void> {
  await Bun.write(join(DATA_DIR, ".not-to-do-items.tmp.json"), JSON.stringify(data, null, 2));
  const fs = await import("fs/promises");
  // dataディレクトリがなければ作成
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.rename(
    join(DATA_DIR, ".not-to-do-items.tmp.json"),
    DATA_FILE,
  );
}
