import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border min-h-screen p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              fpx
            </div>
            <span className="font-semibold text-foreground">API docs</span>
          </div>

          <div className="relative mb-6">
            <Input
              type="search"
              placeholder="Search"
              className="w-full pr-12 bg-white"
            />
            <kbd className="pointer-events-none absolute right-3 top-2.5 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            <div className="mb-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-foreground font-semibold hover:bg-muted"
              >
                GEESE
              </Button>
              <div className="space-y-0.5 pl-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  CreateGoose
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  CreateQuote
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  DeleteGoose
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  DeleteQuote
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  EditGoose
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  Editquote
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  ErrorResponse
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  FlockLeader
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  GeeseQuotes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  Honc
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  ListGeese
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                >
                  ListQuotes
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              ANIMALS
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              DOGGOS
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              CATS
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              REPTILES
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              FISH
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground font-semibold hover:bg-muted"
            >
              DEER
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                1.0.0
              </span>
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                OAS 3.0.0
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Geese API
            </h1>
            <p className="text-muted-foreground mb-8">
              The Geese API allows for creating and managing wise geese quotes
              and syncing the related data with supported systems
            </p>

            {/* Base URL section */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase mb-2">
                BASE URL
              </h2>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">
                http://localhost:8788/requestor
              </div>
            </div>

            {/* Client Libraries section */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase mb-2">
                CLIENT LIBRARIES
              </h2>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="gap-2 bg-accent text-accent-foreground border-accent hover:bg-accent/80"
                >
                  Shell
                </Button>
                <Button variant="outline" className="gap-2">
                  Ruby
                </Button>
                <Button variant="outline" className="gap-2">
                  Node.js
                </Button>
                <Button variant="outline" className="gap-2">
                  PHP
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
