import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

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
      return { ok: true, json: async () => ({ plan: "free", maxItems: 3 }) };
    }
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

describe("App user switching", () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows the current user and lets you switch users", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("現在のユーザー: userA")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "userB" }));

    expect(screen.getByText("現在のユーザー: userB")).toBeInTheDocument();
  });
});
