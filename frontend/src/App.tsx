import { QueryClientProvider, queryClient } from "@/queries";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./Layout";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/Requests";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<RequestsPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/:traceId" element={<RequestDetailsPage />} />
            <Route path="/requestor" element={<RequestorPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
