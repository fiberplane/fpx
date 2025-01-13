import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#E0DFDC] min-h-screen p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-[#FF5733] text-white flex items-center justify-center font-semibold">
              fpx
            </div>
            <span className="font-semibold text-[#0F0E0C]">API docs</span>
          </div>
          
          <div className="relative mb-4">
            <Input 
              type="search" 
              placeholder="Search" 
              className="w-full pr-12"
            />
            <kbd className="pointer-events-none absolute right-3 top-2.5 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-[#0F0E0C] font-medium"
            >
              GEESE
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">1.0.0</span>
              <span className="px-2 py-1 bg-muted rounded text-xs font-medium">OAS 3.0.0</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Geese API</h1>
            <p className="text-muted-foreground mb-8">
              The Geese API allows for creating and managing wise geese quotes
              and syncing the related data with supported systems
            </p>

            {/* Base URL section */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase mb-2">BASE URL</h2>
              <div className="p-3 bg-muted/10 rounded-md font-mono text-sm">
                http://localhost:8788/requestor
              </div>
            </div>

            {/* Client Libraries section */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase mb-2">CLIENT LIBRARIES</h2>
              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <div className="w-4 h-4">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <title>Terminal icon</title>
                      <path d="M3 3h18v18H3V3zm16.5 1.5H4.5v15h15v-15z" />
                      <path d="M8 8h8v2H8z" />
                    </svg>
                  </div>
                  Shell
                </Button>
                <Button variant="outline" className="gap-2">
                  <div className="w-4 h-4">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <title>Node.js icon</title>
                      <path d="M12 18.8c-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8 5.8 2.6 5.8 5.8-2.6 5.8-5.8 5.8z" />
                    </svg>
                  </div>
                  Node.js
                </Button>
                <Button variant="outline" className="gap-2">
                  <div className="w-4 h-4">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <title>Python icon</title>
                      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                    </svg>
                  </div>
                  Python
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
