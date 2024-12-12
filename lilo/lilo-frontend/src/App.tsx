import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { LOGOUT_PATH } from "./constants";
import { useSession } from "./hooks/use-session";
import { Layout } from "./layout";
import { DashboardPage } from "./pages/DashboardPage";

const queryClient = new QueryClient();

function AuthContent() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
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

  if (!session.user.allowed) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">You are not on the list!</h1>
        <p className="text-lg">Ask Brett to add you to the list</p>
        <a href={LOGOUT_PATH} className="text-lg">
          Log out
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
