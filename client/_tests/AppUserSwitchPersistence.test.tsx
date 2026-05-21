import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

function mockFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/items")) return { ok: true, json: async () => [] };
    if (url.endsWith("/api/reviews/summary")) return { ok: true, json: async () => [] };
    if (url.endsWith("/api/reviews")) return { ok: true, json: async () => [] };
    if (url.includes("/api/plan/")) return { ok: true, json: async () => ({ plan: "free", maxItems: 3 }) };
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

describe("App user switch persistence", () => {
  beforeEach(() => {
    mockFetch();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("restores the previously selected user from localStorage", async () => {
    localStorage.setItem("not-to-do.currentUser", "userB");
    render(<App />);

    expect(screen.getByText("現在のユーザー: userB")).toBeInTheDocument();
  });

  it("persists the selected user when switching users", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "userB" }));

    expect(localStorage.getItem("not-to-do.currentUser")).toBe("userB");
  });
});
