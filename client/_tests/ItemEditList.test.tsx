import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemEditList } from "../src/components/ItemEditList";
import type { NotToDoItem } from "../src/types";

const baseItem: NotToDoItem = {
  id: "item-1",
  title: "SNSを見ない",
  reason: "集中力が下がるから",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  targetDays: 66,
  currentAttempt: 1,
};

describe("ItemEditList", () => {
  it("編集ボタンを押すとフォームが表示される", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<ItemEditList items={[baseItem]} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.queryByRole("textbox", { name: "タイトル" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));

    expect(screen.getByRole("textbox", { name: "タイトル" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "理由" })).toBeInTheDocument();
  });

  it("保存すると onEdit が呼ばれる", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<ItemEditList items={[baseItem]} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));

    const titleInput = screen.getByRole("textbox", { name: "タイトル" });
    await user.clear(titleInput);
    await user.type(titleInput, "新しいタイトル");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onEdit).toHaveBeenCalledWith("item-1", {
      title: "新しいタイトル",
      reason: "集中力が下がるから",
    });
  });

  it("「完了にする」ボタンが completedAt を設定する", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<ItemEditList items={[baseItem]} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "完了にする" }));

    expect(onEdit).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ completedAt: expect.any(String) }),
    );
  });

  it("「完了を取り消す」ボタンで completedAt がクリアされる", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    const completedItem: NotToDoItem = {
      ...baseItem,
      completedAt: "2026-03-01T00:00:00.000Z",
    };

    render(<ItemEditList items={[completedItem]} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "完了を取り消す" }));

    expect(onEdit).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ completedAt: null }),
    );
  });
});
