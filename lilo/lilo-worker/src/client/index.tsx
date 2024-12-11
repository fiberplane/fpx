import { StrictMode } from "hono/jsx";
import { hydrateRoot } from "hono/jsx/dom/client";

import { Counter } from "./Counter";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

hydrateRoot(
  root,
  <StrictMode>
    <Counter />
  </StrictMode>
);