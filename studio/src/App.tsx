import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { type ReactNode, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
              <Route
                path="/requestor/:requestType/:id"
                element={<RequestorPage />}
              />
            </Routes>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </Router>
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
