import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import { LogsPage } from "./pages/LogsPage/LogsPage";
import { TracesPage } from "./pages/Traces/Traces";

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TracesPage />} />
          <Route path="/traces" element={<TracesPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App;