import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import { LogsPage } from "./pages/LogsPage/LogsPage";
import { RequestsPage } from "./pages/Requests/Requests";

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<RequestsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App;
