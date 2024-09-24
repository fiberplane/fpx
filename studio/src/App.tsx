import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import {
  REQUESTOR_TRACE_ROUTE,
  REQUESTS_ROUTE,
  REQUEST_DETAILS_OTEL_ROUTE,
  REQUEST_DETAILS_TRACE_ROUTE,
  ROOT_ROUTE,
} from "./constants";
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
              <Route path={REQUESTS_ROUTE} element={<RequestsPage />} />
              <Route
                path={REQUEST_DETAILS_OTEL_ROUTE}
                element={<RequestDetailsPage />}
              />
              <Route
                path={REQUEST_DETAILS_TRACE_ROUTE}
                element={<RequestDetailsPage />}
              />
              <Route path={ROOT_ROUTE} element={<RequestorPage />} />
              <Route path={REQUESTOR_TRACE_ROUTE} element={<RequestorPage />} />
            </Routes>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
