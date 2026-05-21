import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("初期状態がローカルモードであること", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.auth.mode).toBe("local");
    expect(result.current.auth.userId).toBe("userA");
  });

  it("switchUser で userId が切り替わること", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.switchUser("userB");
    });
    expect(result.current.auth.mode).toBe("local");
    expect(result.current.auth.userId).toBe("userB");
  });

  it("login がダミーであること（アラートが呼ばれる）", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("google");
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("近日公開"));
    expect(result.current.auth.mode).toBe("local");
  });

  it("logout でローカルモードに戻ること", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.logout();
    });
    expect(result.current.auth.mode).toBe("local");
    expect(result.current.auth.userId).toBe("userA");
  });
});
