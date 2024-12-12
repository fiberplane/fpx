import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./Layout";
import { Toaster } from "./components/ui/toaster";
import { useSession } from "./hooks/use-session";
import { DashboardPage } from "./pages/DashboardPage";

const queryClient = new QueryClient();

function AuthContent() {
  const { data: user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Welcome to Lilo</h1>
        <a
          href="/auth/github"
          className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Login with GitHub
        </a>
      </div>
    );
  }

  return (
    <Layout>
      <DashboardPage />
      <Toaster />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContent />
    </QueryClientProvider>
  );
}

export default App;
