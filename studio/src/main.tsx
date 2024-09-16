import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { RuntimeProvider } from "./RuntimeProvider";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Application failed to start: missing root element");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RuntimeProvider>
      <App />
    </RuntimeProvider>
  </React.StrictMode>,
);
