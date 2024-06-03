import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import { RequestsPage } from "./pages/RequestsPage/Requests";
import { QueryClientProvider, queryClient } from "@/queries/queries";
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
        </Routes>
      </Layout>
    </Router>
    </QueryClientProvider>
  )
}

export default App;