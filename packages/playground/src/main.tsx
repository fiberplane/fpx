import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { parseEmbeddedConfig } from "./utils";

export const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element not found");
}

// NOTE: Mounted path defines which path the whole playground is mounted on. The
// client router needs to know this so it can generate correct links
const { mountedPath, openapi } = parseEmbeddedConfig(rootElement);

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  basepath: mountedPath,
  context: { queryClient, openapi },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 10 * 1000,
});

// Provide type safety for the router
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
