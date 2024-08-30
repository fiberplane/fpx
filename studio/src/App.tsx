import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { type ReactNode, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import Layout from "./Layout";
import { Toaster } from "./components/ui/toaster";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import {
  RequestorPage,
  RequestorSessionHistoryProvider,
} from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Tauri } from "./components/Tauri";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RequestorSessionHistoryProvider>
        <Router>
          <Tauri />
          <TooltipProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Redirect />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route
                  path="/requests/otel/:traceId"
                  element={<RequestDetailsPage />}
                />
                <Route
                  path="/requests/:traceId"
                  element={<RequestDetailsPage />}
                />
                <Route path="/requestor" element={<RequestorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
            <Toaster />
          </TooltipProvider>
        </Router>
      </RequestorSessionHistoryProvider>
    </QueryClientProvider>
  );
}

export default App;

function Redirect({ to = "/requestor" }: { to?: string }): ReactNode {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [to, navigate]);

  return null;
}
