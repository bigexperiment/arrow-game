import React from "react";
import ReactDOM from "react-dom/client";
import ArrowsGame from "../arrows-game.jsx";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ArrowsGame />
  </React.StrictMode>,
);
