import { QueryClientProvider, queryClient } from "@/queries";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import {
  INTERNAL_AI_LOGS_ROUTE,
  INTERNAL_AI_LOGS_WITH_ID_ROUTE,
} from "./constants";
import { AiRequestLogDetailsPage } from "./pages/AiRequestLogsPage/AiRequestLogDetailsPage";
import { AiRequestLogsPage } from "./pages/AiRequestLogsPage/AiRequestLogsPage";
import { RequestorPage } from "./pages/RequestorPage";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TooltipProvider>
          <Layout>
            <Routes>
              <Route
                path={INTERNAL_AI_LOGS_ROUTE}
                element={<AiRequestLogsPage />}
              />
              <Route
                path={INTERNAL_AI_LOGS_WITH_ID_ROUTE}
                element={<AiRequestLogDetailsPage />}
              />
              <Route path="*" element={<RequestorPage />} />
            </Routes>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
