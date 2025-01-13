import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element not found");
}

// NOTE: Mount path defines which path the whole playground is mounted on. The
// client router needs to know this so it can generate correct links
const mountPath = rootElement.getAttribute("data-mount-path");

const router = createRouter({ routeTree, basepath: mountPath ?? undefined });
const queryClient = new QueryClient();

// Register your router for maximum type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
