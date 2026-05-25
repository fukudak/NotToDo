import "@testing-library/jest-dom/vitest";
import { JSDOM } from "jsdom";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(),
}));

/** Node の experimental localStorage を jsdom の実装に統一する */
export function installLocalStorage(): void {
  const { localStorage } = new JSDOM("", { url: "http://localhost/" }).window;
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    configurable: true,
    writable: true,
  });
}

installLocalStorage();

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});
