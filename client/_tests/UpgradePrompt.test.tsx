import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpgradePrompt } from "../src/components/UpgradePrompt";

describe("UpgradePrompt", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("無料版の場合にアップグレードボタンが表示される", () => {
    render(<UpgradePrompt plan="free" />);
    expect(screen.getByRole("button", { name: "アップグレード" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "復元購入" })).toBeInTheDocument();
  });

  it("無料版の場合に無料版の制限が表示される", () => {
    render(<UpgradePrompt plan="free" />);
    expect(screen.getByText(/3件まで/)).toBeInTheDocument();
    // spec-v2更新により「エクスポート可」に修正（矛盾解消）
    expect(screen.getByText(/エクスポート可/)).toBeInTheDocument();
  });

  it("無料版の場合に有料版の特典が表示される", () => {
    render(<UpgradePrompt plan="free" />);
    // spec-v2更新: 「無制限」は制限解除の代表機能
    expect(screen.getByText(/無制限/)).toBeInTheDocument();
    // 優先サポートは有料のメリットとして残存
    expect(screen.getByText(/優先サポート/)).toBeInTheDocument();
  });

  it("有料版の場合に「有料版です」と表示される", () => {
    render(<UpgradePrompt plan="pro" />);
    expect(screen.getByText(/有料版です/)).toBeInTheDocument();
  });

  it("有料版の場合にアップグレードボタンが表示されない", () => {
    render(<UpgradePrompt plan="pro" />);
    expect(screen.queryByRole("button", { name: "アップグレード" })).not.toBeInTheDocument();
  });

  it("アップグレードボタンをクリックするとアラートが表示される", async () => {
    const user = userEvent.setup();
    render(<UpgradePrompt plan="free" />);
    await user.click(screen.getByRole("button", { name: "アップグレード" }));
    expect(window.alert).toHaveBeenCalledWith("近日公開です");
  });

  it("復元購入ボタンをクリックするとアラートが表示される", async () => {
    const user = userEvent.setup();
    render(<UpgradePrompt plan="free" />);
    await user.click(screen.getByRole("button", { name: "復元購入" }));
    expect(window.alert).toHaveBeenCalledWith("近日公開です");
  });
});
