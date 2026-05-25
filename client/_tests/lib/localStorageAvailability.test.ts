import { describe, expect, it, vi } from "vitest";
import { isLocalStorageAvailable } from "../../src/lib/localStorageAvailability";

describe("isLocalStorageAvailable", () => {
  it("localStorage が使える環境では true", () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("setItem が例外を投げる場合は false", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(isLocalStorageAvailable()).toBe(false);
    setItem.mockRestore();
  });
});
