import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

const defaultPlan = { userId: "userA", plan: "free", maxItems: 3 };

function mockFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/items")) {
      return { ok: true, json: async () => [] };
    }
    if (url.endsWith("/api/reviews/summary")) {
      return { ok: true, json: async () => [] };
    }
    if (url.endsWith("/api/reviews")) {
      return { ok: true, json: async () => [] };
    }
    if (url.includes("/api/plan/")) {
      return { ok: true, json: async () => defaultPlan };
    }
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

describe("App skeleton", () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows list, edit, and settings screens", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("tab", { name: "リスト" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "編集" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "設定" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "編集" }));
    expect(screen.getByText("アイテムがありません")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "設定" }));
    expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/現在のプラン:/)).toBeInTheDocument();
    });
  });
});
