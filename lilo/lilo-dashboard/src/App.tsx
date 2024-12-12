import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { useSession } from "./hooks/use-session";
import { Layout } from "./layout";
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
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Welcome to Lilo</h1>
        <Button asChild>
          <a
            className="mb-12 text-primary-foreground hover:text-primary-foreground/90"
            href="/auth/github"
          >
            Login with GitHub
          </a>
        </Button>
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
