import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

function mockFetch() {
  const json = async (data: unknown) => ({
    ok: true,
    json: async () => data,
  });

  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/items")) return json([]);
    if (url.endsWith("/api/reviews/summary")) return json([]);
    if (url.endsWith("/api/reviews")) return json([]);
    if (url.includes("/api/plan/")) return json({ userId: "userA", plan: "free", maxItems: 3 });
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

describe("App shell", () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the main shell with accessible tabs and switches panels", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "やらないことリスト" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "画面切り替え" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "リスト" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "+ やらないことを追加" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("「やらないこと」はまだありません")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "振り返り" }));
    expect(screen.getByRole("tab", { name: "振り返り" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "振り返り" })).toBeInTheDocument();
  });

  it("currentUser で表示するデータを切り替える", async () => {
    const mixedItems = [
      {
        id: "item-a",
        title: "userAのアイテム",
        reason: "A用",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        startDate: "2026-01-01",
        targetDays: 66,
        currentAttempt: 1,
        userId: "userA",
      },
      {
        id: "item-b",
        title: "userBのアイテム",
        reason: "B用",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        startDate: "2026-01-01",
        targetDays: 66,
        currentAttempt: 1,
        userId: "userB",
      },
    ];
    const mixedReviews = [
      {
        id: "review-a",
        itemId: "item-a",
        adherence: "kept",
        reflection: "Aの振り返り",
        reviewedAt: "2026-01-02T00:00:00.000Z",
        attemptNumber: 1,
        userId: "userA",
      },
      {
        id: "review-b",
        itemId: "item-b",
        adherence: "broke",
        reflection: "Bの振り返り",
        reviewedAt: "2026-01-02T00:00:00.000Z",
        attemptNumber: 1,
        userId: "userB",
      },
    ];

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/items")) return { ok: true, json: async () => mixedItems };
      if (url.includes("/api/reviews/summary")) {
        return {
          ok: true,
          json: async () => [
            { itemId: "item-a", totalReviews: 1, keptCount: 1, brokeCount: 0 },
            { itemId: "item-b", totalReviews: 1, keptCount: 0, brokeCount: 1 },
          ],
        };
      }
      if (url.includes("/api/reviews")) return { ok: true, json: async () => mixedReviews };
      if (url.includes("/api/plan/")) return { ok: true, json: async () => ({ userId: "userA", plan: "free", maxItems: 3 }) };
      throw new Error(`unexpected fetch: ${url}`);
    }));

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("userAのアイテム")).toBeInTheDocument();
    });
    expect(screen.queryByText("userBのアイテム")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "振り返り" }));
    await waitFor(() => {
      expect(screen.getByText("Aの振り返り")).toBeInTheDocument();
    });
    expect(screen.queryByText("Bの振り返り")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "userB" }));
    expect(screen.getByText("Bの振り返り")).toBeInTheDocument();
    expect(screen.queryByText("Aの振り返り")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "リスト" }));
    await waitFor(() => {
      expect(screen.getByText("userBのアイテム")).toBeInTheDocument();
    });
    expect(screen.queryByText("userAのアイテム")).not.toBeInTheDocument();
  });
});
