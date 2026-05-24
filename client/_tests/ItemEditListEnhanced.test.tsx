import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemEditList } from "../src/components/ItemEditList";
import type { NotToDoItem } from "../src/types";

const items: NotToDoItem[] = [
  {
    id: "item-1",
    title: "SNSを見ない",
    reason: "集中力が下がるから",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startDate: "2026-01-01",
    targetDays: 66,
    currentAttempt: 1,
  },
  {
    id: "item-2",
    title: "夜更かし",
    reason: "朝起きられない",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    startDate: "2026-02-01",
    targetDays: 21,
    currentAttempt: 1,
    completedAt: "2026-03-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

const onEdit = vi.fn().mockResolvedValue(undefined);
const onDelete = vi.fn().mockResolvedValue(undefined);
const user = userEvent.setup();

describe("ItemEditList 強化テスト", () => {
  // ── リスト描画 ──

  it("複数アイテムがリスト表示される", () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText("SNSを見ない")).toBeInTheDocument();
    expect(screen.getByText("夜更かし")).toBeInTheDocument();
    expect(screen.getByText("✓ 完了")).toBeInTheDocument();
  });

  it("空リストのとき「アイテムがありません」が表示される", () => {
    render(<ItemEditList items={[]} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText("アイテムがありません")).toBeInTheDocument();
  });

  // ── 編集モード開始 ──

  it("編集ボタンを押すと form が表示され、初期値にタイトル・理由が入る", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));

    expect(screen.getByRole("textbox", { name: "タイトル" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "理由" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("SNSを見ない");
    expect(screen.getByRole("textbox", { name: "理由" })).toHaveValue("集中力が下がるから");
  });

  it("複数アイテムから1つ目を編集しても2つ目の編集フォームは出ない（排他）", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));

    // "夜更かし" の編集ボタンは無い → item-2 の編集フォームは出ない
    expect(screen.queryByRole("textbox", { name: /夜更かし/ })).not.toBeInTheDocument();
  });

  // ── キャンセル ──

  it("キャンセルでフォームが閉じ、元のitem-rowに戻る", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("textbox", { name: "タイトル" })).not.toBeInTheDocument();
    expect(screen.getByText("SNSを見ない")).toBeInTheDocument();
  });

  // ── 保存 ──

  it("タイトルを変更して保存→onEdit が新しい title で呼ばれる", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.clear(screen.getByRole("textbox", { name: "タイトル" }));
    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "新しいタイトル");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onEdit).toHaveBeenCalledWith("item-1", {
      title: "新しいタイトル",
      reason: "集中力が下がるから",
    });
  });

  it("理由を変更して保存→onEdit が新しい reason で呼ばれる", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.clear(screen.getByRole("textbox", { name: "理由" }));
    await user.type(screen.getByRole("textbox", { name: "理由" }), "新しい理由");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onEdit).toHaveBeenCalledWith("item-1", expect.objectContaining({
      reason: "新しい理由",
    }));
  });

  it("保存成功後、フォームが閉じられる", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.queryByRole("textbox", { name: "タイトル" })).not.toBeInTheDocument();
  });

  // ── 完了 / 取り消し ──

  it("「完了にする」→ onEdit に completedAt が渡される", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "完了にする" }));

    expect(onEdit).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ completedAt: expect.any(String) }),
    );
  });

  it("「完了を取り消す」→ onEdit に completedAt: null が渡される", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    // item-2 は completedAt 済み
    await user.click(screen.getByRole("button", { name: "夜更かしを編集" }));
    await user.click(screen.getByRole("button", { name: "完了を取り消す" }));

    expect(onEdit).toHaveBeenCalledWith(
      "item-2",
      expect.objectContaining({ completedAt: null }),
    );
  });

  it("「完了にする」でフォームが閉じられる", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "完了にする" }));

    expect(screen.queryByRole("textbox", { name: "タイトル" })).not.toBeInTheDocument();
  });

  // ── 削除 ──

  it("削除ボタンクリックで onDelete が呼ばれる", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    await user.click(screen.getByRole("button", { name: "SNSを見ないを削除" }));

    expect(onDelete).toHaveBeenCalledWith("item-1");
  });

  // ── 既存 item-row: 編集後別アイテム edit 状態がクリアされる ──

  it("item-1 の編集中に別アイテムの編集を開始すると前の form が閉じられる（排他）", async () => {
    render(<ItemEditList items={items} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "SNSを見ないを編集" }));
    // item-1 の form が開いている: タイトルinputの値が"SNSを見ない"
    expect(screen.getByLabelText("タイトル")).toHaveValue("SNSを見ない");

    // 別アイテム（item-2）の編集を開始
    await user.click(screen.getByRole("button", { name: "夜更かしを編集" }));

    // item-1 の form は閉じられている → タイトルinputの値は item-2 になっている
    expect(screen.getByLabelText("タイトル")).toHaveValue("夜更かし");
    expect(screen.getByLabelText("理由")).toHaveValue("朝起きられない");
  });
});
