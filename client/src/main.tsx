import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AboutPage } from "./components/AboutPage";
import { App } from "./App";
import "./index.css";

registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) {
  throw new Error("ルート要素が見つかりません");
}

const page = window.location.pathname === "/about" ? <AboutPage /> : <App />;

createRoot(root).render(<StrictMode>{page}</StrictMode>);
