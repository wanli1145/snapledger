import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LocaleProvider } from "./lib/i18n.jsx";
import "./styles.css";
import "./memory.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);

// PWA：仅生产构建注册，开发时不缓存以免干扰热更新
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    // BASE_URL 适配子路径部署（如 GitHub Pages）
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
