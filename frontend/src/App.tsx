import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
<<<<<<< HEAD
import { RequestsPage } from "./pages/RequestsPage/Requests";
import { PackagesPage } from "./pages/Packages/Packages";
import { QueryClientProvider, queryClient } from "@/queries/react-query-test";
=======
import { RequestsPage } from "./pages/RequestsPage/Requests";
import { QueryClientProvider, queryClient } from "@/queries/queries";
import { RequestDetailsPage } from "./pages/RequestDetailsPage/RequestDetailsPage";
>>>>>>> refs/rewritten/main

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<RequestsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
<<<<<<< HEAD
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
=======
          <Route path="/requests/:traceId" element={<RequestDetailsPage />} />
>>>>>>> refs/rewritten/main
        </Routes>
      </Layout>
    </Router>
    </QueryClientProvider>
  )
}

export default App;
