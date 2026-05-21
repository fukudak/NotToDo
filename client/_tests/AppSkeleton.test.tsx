import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App skeleton", () => {
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
    // localStorageからプランを同期取得するので即座に表示される
    await waitFor(() => {
      expect(screen.getByText(/現在のプラン:/)).toBeInTheDocument();
    });
  });
});
