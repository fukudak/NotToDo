const TEST_KEY = "__not-to-do-ls-test__";

/** localStorage が読み書き可能か（プライベートブラウジング等では false） */
export function isLocalStorageAvailable(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(TEST_KEY, "1");
    localStorage.removeItem(TEST_KEY);
    return true;
  } catch {
    return false;
  }
}
