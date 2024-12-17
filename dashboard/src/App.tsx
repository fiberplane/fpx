import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Dashboard } from "./components/dashboard";
import { Layout } from "./components/layout";

export function App() {
  return (
    <Layout>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </Layout>
  );
}

export default App;
