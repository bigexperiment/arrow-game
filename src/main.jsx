import React from "react";
import ReactDOM from "react-dom/client";
import ArrowsGame from "../new-update.jsx";
import { registerSW } from "virtual:pwa-register";

if (typeof window !== "undefined" && /^https?:$/.test(window.location.protocol)) {
  registerSW({
    immediate: true,
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ArrowsGame />
  </React.StrictMode>,
);
