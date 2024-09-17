import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { RuntimeProvider } from "./tauri";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Application failed to start: missing root element");
}

ReactDOM.createRoot(root).render(
  <RuntimeProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RuntimeProvider>,
);
