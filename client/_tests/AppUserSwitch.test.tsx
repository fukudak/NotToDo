import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App user switching", () => {
  it("shows the current user and lets you switch users", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("現在のユーザー: userA")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "userB" }));

    expect(screen.getByText("現在のユーザー: userB")).toBeInTheDocument();
  });
});
