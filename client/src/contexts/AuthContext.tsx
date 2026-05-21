import { createContext, useContext, useState } from "react";
import type { UserId } from "../types";

const STORAGE_KEY = "not-to-do.currentUser";

type AuthState =
  | { mode: "local"; userId: UserId }
  | { mode: "authenticated"; userId: string; email?: string };

interface AuthContextValue {
  auth: AuthState;
  switchUser: (userId: UserId) => void;
  login: (provider: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialAuth(): AuthState {
  if (typeof localStorage === "undefined") return { mode: "local", userId: "userA" };
  const stored = localStorage.getItem(STORAGE_KEY);
  return { mode: "local", userId: stored === "userB" ? "userB" : "userA" };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialAuth);

  const switchUser = (userId: UserId) => {
    setAuth({ mode: "local", userId });
    localStorage.setItem(STORAGE_KEY, userId);
  };

  const login = async (_provider: string) => {
    window.alert("近日公開です");
  };

  const logout = () => {
    const userId: UserId = "userA";
    setAuth({ mode: "local", userId });
    localStorage.setItem(STORAGE_KEY, userId);
  };

  return (
    <AuthContext.Provider value={{ auth, switchUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の内側で使用してください");
  return ctx;
}
