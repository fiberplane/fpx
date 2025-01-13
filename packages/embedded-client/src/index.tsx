import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (container) {
  // biome-ignore lint/style/noNonNullAssertion: WIP
  const mountPath = container.dataset.mountPath!;
  const root = createRoot(container);
  root.render(<App mountPath={mountPath} />);
}
