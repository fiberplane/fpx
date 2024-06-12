import { QueryClientProvider, queryClient } from "@/queries";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./Layout";
import { RequestorPage } from "./pages/RequestorPage";
import { RequestsPage } from "./pages/RequestsPage/Requests";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";

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
