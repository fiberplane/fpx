import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Dashboard } from "./components/dashboard";
import { Insights } from "./components/insights";
import { Layout } from "./components/layout";
import { Tokens } from "./components/tokens";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
