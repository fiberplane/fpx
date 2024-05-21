import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import { LogsPage } from "./pages/Logs/Logs";
import { TracesPage } from "./pages/Traces/Traces";

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LogsPage />} />
          <Route path="/traces" element={<TracesPage />} />
          <Route path="/logs/:id" element={<LogsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App;