import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Dashboard } from "./components/dashboard";
import { Insights } from "./components/insights";
import { Layout } from "./components/layout";
import { Tokens } from "./components/tokens";

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/insights" element={<Insights />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
