import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installLocalStorage } from "./setup";
import { App } from "../src/App";

const sampleItems = [
  {
    id: "item-a",
    title: "SNSを見ない",
    reason: "時間の無駄",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startDate: "2026-01-01",
    targetDays: 66,
    currentAttempt: 1,
  },
  {
    id: "item-b",
    title: "夜更きしない",
    reason: "健康のため",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startDate: "2026-01-01",
    targetDays: 66,
    currentAttempt: 1,
  },
];

describe("App shell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    installLocalStorage();
  });

  it("renders the main shell with accessible tabs and switches panels", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "やらないことリスト" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "画面切り替え" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "リスト" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "+ やらないことを追加" })).toBeInTheDocument();

    expect(screen.getByText("まだ「やらないこと」がありません")).toBeInTheDocument();
    expect(screen.getByLabelText("バージョン 0.9.0")).toHaveTextContent("v0.9.0");

    await user.click(screen.getByRole("tab", { name: "振り返り" }));
    expect(screen.getByRole("tab", { name: "振り返り" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "振り返り" })).toBeInTheDocument();
  });

  it("localStorage の全アイテムを表示する", async () => {
    localStorage.setItem("not-to-do-items", JSON.stringify(sampleItems));

    render(<App />);

    expect(screen.getByText("SNSを見ない")).toBeInTheDocument();
    expect(screen.getByText("夜更きしない")).toBeInTheDocument();
  });

  it("localStorage が使えないとき警告を表示する", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("The operation is insecure.");
      },
      removeItem: () => {},
    });

    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent("このブラウザではデータを保存できません");
  });
});
