import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App user switch persistence", () => {
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
