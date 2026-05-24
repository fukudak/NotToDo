import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

// 他のテストファイルの useFakeTimers リークを遮断
afterEach(() => {
  vi.useRealTimers();
});
