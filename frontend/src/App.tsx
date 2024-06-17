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
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/RequestsPage";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Redirect />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/:traceId" element={<RequestDetailsPage />} />
            <Route path="/requestor" element={<RequestorPage />} />
            <Route path="/issues" element={<IssuesPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

function Redirect({ to = "/requests" }: { to?: string }): ReactNode {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [to, navigate]);

  return null;
}
