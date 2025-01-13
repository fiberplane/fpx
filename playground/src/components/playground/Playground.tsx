import { Input } from "@/components/ui/input";
import { Navigation } from "./Navigation";
import { getNavigationData } from "./navigation-data";
import { RequestViewer } from "./request-viewer/RequestViewer";

export function Playground() {
  const navigationItems = getNavigationData();

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

          <Navigation items={navigationItems} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen flex flex-col">
          <RequestViewer 
            method="POST"
            path="/api/geese"
          />
        </main>
      </div>
    </div>
  );
}
