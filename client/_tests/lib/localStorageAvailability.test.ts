import { afterEach, describe, expect, it, vi } from "vitest";
import { installLocalStorage } from "../setup";
import { isLocalStorageAvailable } from "../../src/lib/localStorageAvailability";

describe("isLocalStorageAvailable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    installLocalStorage();
  });

  it("localStorage が使える環境では true", () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("setItem が例外を投げる場合は false", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => {},
    });
    expect(isLocalStorageAvailable()).toBe(false);
  });
});
