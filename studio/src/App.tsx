import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";

export const REQUESTS_ROUTE = "/requests";
export const REQUEST_DETAILS_OTEL_ROUTE = "/requests/otel/:traceId";
export const REQUEST_DETAILS_TRACE_ROUTE = "/requests/:traceId";
export const ROOT_ROUTE = "/";
export const REQUESTOR_TRACE_ROUTE = "/:requestType/:traceId";

export const TRACE_ID_ROUTES = [
  REQUEST_DETAILS_OTEL_ROUTE,
  REQUEST_DETAILS_TRACE_ROUTE,
  REQUESTOR_TRACE_ROUTE,
];

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
