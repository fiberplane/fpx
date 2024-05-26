import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import { LogsPage } from "./pages/LogsPage/LogsPage";
import { RequestsPage } from "./pages/Requests/Requests";
import { QueryClientProvider, queryClient } from "@/queries/react-query-test";
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
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </Layout>
    </Router>
    </QueryClientProvider>
  )
}

export default App;