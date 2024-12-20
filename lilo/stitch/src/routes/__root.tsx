import * as React from "react";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [token, setToken] = React.useState(() => 
    localStorage.getItem("api-token") || ""
  );
  const [showToken, setShowToken] = React.useState(false);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setToken(newToken);
    localStorage.setItem("api-token", newToken);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card">
        <div className="mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center justify-between py-2">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                API Reference
              </Link>
              <Link
                to="/workflow"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                Workflow Generator
              </Link>
            </div>
            <div className="relative flex items-center max-w-xs">
              <Input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={handleTokenChange}
                placeholder="Enter API token"
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 w-8 h-8"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6 mx-auto max-w-[1600px] sm:px-6 lg:px-8">
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </main>
    </div>
  );
}
