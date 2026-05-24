import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddItemForm } from "../../src/components/AddItemForm";

const onAdd = vi.fn().mockResolvedValue(undefined);
beforeEach(() => { vi.clearAllMocks(); });

/** 指定した日数のラジオ label 内の input を取得 */
function radioInput(daysLabel: string): HTMLInputElement {
  return (screen.getByText(daysLabel).closest("label")!.querySelector("input")!) as HTMLInputElement;
}

describe("AddItemForm", () => {
  // ─── フォーム描画 ───

  it("フォームの全フィールドが表示される（isAtLimit 未指定）", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByText("やらないことを追加")).toBeInTheDocument();
    expect(screen.getByLabelText("やらないこと")).toBeInTheDocument();
    expect(screen.getByLabelText("なぜやらないか")).toBeInTheDocument();
    expect(screen.getByLabelText("開始日")).toBeInTheDocument();
    // target-days は単一inputでなくグループなので getByLabelText は使わない
    expect(screen.getByText("習慣化目標期間")).toBeInTheDocument();
    expect(screen.getByText("21日（入門）")).toBeInTheDocument();
    expect(screen.getByText("66日（標準）")).toBeInTheDocument();
    expect(screen.getByText("90日（本格）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "追加する" })).toBeInTheDocument();
  });

  it("タイトルにプレースホルダーが表示される", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByPlaceholderText("例: 深夜のSNS閲覧")).toBeInTheDocument();
  });

  it("理由にプレースホルダーが表示される", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByPlaceholderText("例: 睡眠の質が下がるため")).toBeInTheDocument();
  });

  it("開始日のデフォルト値が今日", () => {
    render(<AddItemForm onAdd={onAdd} />);
    const today = new Date().toISOString().slice(0, 10);
    expect(screen.getByLabelText("開始日")).toHaveValue(today);
  });

  it("デフォルトで66日（標準）が選択されている", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(radioInput("66日（標準）")).toBeChecked();
    expect(radioInput("21日（入門）")).not.toBeChecked();
    expect(radioInput("90日（本格）")).not.toBeChecked();
  });

  it("カスタム入力欄が表示される", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByText("カスタム")).toBeInTheDocument();
  });

  it("Lally研究の注釈が表示される", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByText(/UCL Lally研究/)).toBeInTheDocument();
  });

  // ─── バリデーション ───

  it("タイトルが空のとき追加ボタンが disabled", () => {
    render(<AddItemForm onAdd={onAdd} />);
    expect(screen.getByRole("button", { name: "追加する" })).toBeDisabled();
  });

  it("タイトルのみ入力で disabled", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);
    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    expect(screen.getByRole("button", { name: "追加する" })).toBeDisabled();
  });

  it("理由のみ入力で disabled", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    expect(screen.getByRole("button", { name: "追加する" })).toBeDisabled();
  });

  it("タイトルと理由両方入力で enabled", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);
    await user.type(screen.getByLabelText("やらないこと"), "テストタイトル");
    await user.type(screen.getByLabelText("なぜやらないか"), "テスト理由");
    expect(screen.getByRole("button", { name: "追加する" })).toBeEnabled();
  });

  // ─── 送信 ───

  it("フォーム送信で onAdd が正しい引数で呼ばれる", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("やらないこと"), "深夜のSNS閲覧");
    await user.type(screen.getByLabelText("なぜやらないか"), "睡眠の質が下がるため");
    await user.click(screen.getByRole("button", { name: "追加する" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const [title, reason, startDate, targetDays] = onAdd.mock.calls[0];
    expect(title).toBe("深夜のSNS閲覧");
    expect(reason).toBe("睡眠の質が下がるため");
    expect(targetDays).toBe(66); // 未カスタム
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("送信成功後フォームがリセットされる", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    const titleInput = screen.getByLabelText("やらないこと") as HTMLInputElement;
    const reasonInput = screen.getByLabelText("なぜやらないか") as HTMLTextAreaElement;

    await user.type(titleInput, "テスト");
    await user.type(reasonInput, "理由");
    await user.click(screen.getByRole("button", { name: "追加する" }));

    expect(titleInput).toHaveValue("");
    expect(reasonInput).toHaveValue("");
  });

  it("送信後に目標期間が66日にリセットされる", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    // 90日を選択
    await user.click(screen.getByText("90日（本格）"));
    expect(radioInput("90日（本格）")).toBeChecked();

    // 送信
    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    await user.click(screen.getByRole("button", { name: "追加する" }));

    // リセット後、66日（標準）が再選択されている
    expect(radioInput("66日（標準）")).toBeChecked();
    expect(radioInput("90日（本格）")).not.toBeChecked();
    expect(radioInput("21日（入門）")).not.toBeChecked();
  });

  it("submit で setSubmitting が true になる（ボタン high-level 動作確認）", async () => {
    const capturedOnAdd = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { /* 意図的にresolveしない長いタスク */ }),
    );
    const user = userEvent.setup();
    render(<AddItemForm onAdd={capturedOnAdd} />);

    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");

    // 送信ボタンを押した直後、async処理が開始されていることを確認
    await user.click(screen.getByRole("button", { name: "追加する" }));

    expect(capturedOnAdd).toHaveBeenCalledTimes(1);
    // 引数の内容で callback が正しく発火していることを確認
    expect(capturedOnAdd).toHaveBeenCalledWith(
      "テスト",
      "理由",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      66,
    );
  });

  // ─── 目標日数選択 ───

  it("21日を選択して送信すると targetDays=21", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.click(radioInput("21日（入門）"));
    expect(radioInput("21日（入門）")).toBeChecked();

    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    await user.click(screen.getByRole("button", { name: "追加する" }));

    const [, , , targetDays] = onAdd.mock.calls[0];
    expect(targetDays).toBe(21);
  });

  it("90日を選択して送信すると targetDays=90", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.click(radioInput("90日（本格）"));
    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    await user.click(screen.getByRole("button", { name: "追加する" }));

    const [, , , targetDays] = onAdd.mock.calls[0];
    expect(targetDays).toBe(90);
  });

  it("カスタムを選択すると数値入力ボックスが表示される", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);
    await user.click(screen.getByText("カスタム"));
    expect(screen.getByPlaceholderText("日数")).toBeInTheDocument();
  });

  it("カスタム入力を onAdd に渡す", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    await user.click(screen.getByText("カスタム"));
    const customInput = screen.getByPlaceholderText("日数") as HTMLInputElement;
    await user.type(customInput, "120");

    await user.click(screen.getByRole("button", { name: "追加する" }));

    const [, , , targetDays] = onAdd.mock.calls[0];
    expect(targetDays).toBe(120);
  });

  it("カスタム入力が空のときデフォルト66で送信される", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("やらないこと"), "テスト");
    await user.type(screen.getByLabelText("なぜやらないか"), "理由");
    await user.click(screen.getByText("カスタム"));
    // 空のまま送信 → parseInt("") → 0 → 0 || 66 → 66
    await user.click(screen.getByRole("button", { name: "追加する" }));

    const [, , , targetDays] = onAdd.mock.calls[0];
    expect(targetDays).toBe(66);
  });

  it("カスタムに入力中に標準ラジオを選ぶとカスタムがクリアされる", async () => {
    const user = userEvent.setup();
    render(<AddItemForm onAdd={onAdd} />);

    await user.click(screen.getByText("カスタム"));
    const customInput = screen.getByPlaceholderText("日数") as HTMLInputElement;
    await user.type(customInput, "100");

    // 標準を選択 → useCustom=false → カスタム入力消える
    await user.click(radioInput("66日（標準）"));

    expect(radioInput("66日（標準）")).toBeChecked();
    expect(screen.queryByPlaceholderText("日数")).not.toBeInTheDocument();
  });

  // ─── isAtLimit ───

  it("isAtLimit=true で plan-limit 通知が表示される", () => {
    render(<AddItemForm onAdd={onAdd} isAtLimit={true} maxItems={3} />);
    expect(screen.getByText("無料版は3件までです")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "アップグレード" })).toBeInTheDocument();
  });
});
