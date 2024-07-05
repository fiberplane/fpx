import { QueryClientProvider, queryClient } from "@/queries";
import { ReactNode, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import Layout from "./Layout";
import { IssuesPage } from "./pages/IssuesPage/IssuesPage";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import {
  RequestorPage,
  RequestorSessionHistoryProvider,
} from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RequestorSessionHistoryProvider>
        <Router>
          {/* <Layout> */}
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Redirect />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route
                  path="/requests/:traceId"
                  element={<RequestDetailsPage />}
                />
                <Route path="/requestor" element={<RequestorPage />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          {/* </Layout> */}
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
