import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddItemForm } from "../src/components/AddItemForm";

describe("AddItemForm 上限到達時", () => {
  it("上限未到達時はフォームが有効で案内テキストなし", () => {
    render(
      <AddItemForm onAdd={async () => {}} isAtLimit={false} maxItems={3} />,
    );

    expect(screen.getByRole("button", { name: "追加する" })).toBeInTheDocument();
    expect(screen.queryByText(/無料版は/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "アップグレード" })).not.toBeInTheDocument();
  });

  it("上限到達時に案内テキストとアップグレードボタンが表示される", () => {
    render(
      <AddItemForm onAdd={async () => {}} isAtLimit={true} maxItems={3} />,
    );

    expect(screen.getByText("無料版は3件までです")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "アップグレード" })).toBeInTheDocument();
  });

  it("上限到達時にフォームのsubmitボタンが非表示になる", () => {
    render(
      <AddItemForm onAdd={async () => {}} isAtLimit={true} maxItems={3} />,
    );

    expect(screen.queryByRole("button", { name: "追加する" })).not.toBeInTheDocument();
  });

  it("isAtLimit が undefined の場合は通常フォームが表示される", () => {
    render(<AddItemForm onAdd={async () => {}} />);

    expect(screen.getByRole("button", { name: "追加する" })).toBeInTheDocument();
    expect(screen.queryByText(/無料版は/)).not.toBeInTheDocument();
  });

  it("上限到達時にonAddは呼ばれない（フォーム非表示）", () => {
    const onAdd = vi.fn();
    render(
      <AddItemForm onAdd={onAdd} isAtLimit={true} maxItems={3} />,
    );

    // submitボタンが存在しないので送信不可
    expect(screen.queryByRole("button", { name: "追加する" })).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
