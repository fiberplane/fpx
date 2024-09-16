import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";
import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { WorkspaceSelector } from "./components/WorkspaceSelector";
import { useHandler } from "@fiberplane/hooks";
import { Button } from "./components/ui/button";

type Workspace = {
  path: string;
};

async function getCurrentWorkspace() {
  return await invoke<Workspace | undefined>("get_current_workspace");
}

export function App() {
  const [workspace, setWorkspace] =
    useState<Awaited<ReturnType<typeof getCurrentWorkspace>>>();

  const closeWorkspace = useHandler(() => {
    invoke("close_workspace");
    setWorkspace(undefined);
  });

  useEffect(() => {
    if (workspace === undefined) {
      getCurrentWorkspace().then(setWorkspace);
    }
  }, [workspace]);

  if (!workspace) {
    return <WorkspaceSelector setWorkspace={setWorkspace} />;
  }

  return (
    <>
      <Button onClick={closeWorkspace}>Close workspace</Button>
      <QueryClientProvider client={queryClient}>
        <Router>
          <TooltipProvider>
            <Layout>
              <Routes>
                <Route path="/requests" element={<RequestsPage />} />
                <Route
                  path="/requests/otel/:traceId"
                  element={<RequestDetailsPage />}
                />
                <Route
                  path="/requests/:traceId"
                  element={<RequestDetailsPage />}
                />
                <Route path="/" element={<RequestorPage />} />
                <Route path="/:requestType/:id" element={<RequestorPage />} />
              </Routes>
            </Layout>
            <Toaster />
          </TooltipProvider>
        </Router>
      </QueryClientProvider>
    </>
  );
}

export default App;
