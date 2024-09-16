import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getRuntime } from "./utils/index.ts";
import { invoke } from "@tauri-apps/api/core";

const runtime = getRuntime();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Application failed to start: missing root element");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {runtime === "tauri" && <Tauri />}
    <App />
  </React.StrictMode>,
);

function Tauri() {
  const [name, setName] = React.useState("");
  const [response, setResponse] = React.useState("");

  const onClick = React.useCallback(() => {
    (async () => {
      const res = await invoke<string>("greet", { name });
      setResponse(res);
    })();
  }, [name]);

  return (
    <div>
      {response ? (
        response
      ) : (
        <>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="button" onClick={onClick}>
            Click
          </button>
        </>
      )}
    </div>
  );
}
