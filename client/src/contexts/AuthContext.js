import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const STORAGE_KEY = "not-to-do.currentUser";
const AuthContext = createContext(null);
function getInitialAuth() {
    if (typeof localStorage === "undefined")
        return { mode: "local", userId: "userA" };
    const stored = localStorage.getItem(STORAGE_KEY);
    return { mode: "local", userId: stored === "userB" ? "userB" : "userA" };
}
export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(getInitialAuth);
    const switchUser = (userId) => {
        setAuth({ mode: "local", userId });
        localStorage.setItem(STORAGE_KEY, userId);
    };
    const login = async (_provider) => {
        window.alert("近日公開です");
    };
    const logout = () => {
        const userId = "userA";
        setAuth({ mode: "local", userId });
        localStorage.setItem(STORAGE_KEY, userId);
    };
    return (_jsx(AuthContext.Provider, { value: { auth, switchUser, login, logout }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth は AuthProvider の内側で使用してください");
    return ctx;
}
