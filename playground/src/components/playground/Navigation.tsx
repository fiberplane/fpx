import { Button } from "@/components/ui/button";
import type { NavigationItem } from "./navigation-data";
import { cn } from "@/lib/utils";

interface NavigationProps {
  items: NavigationItem[];
}

const methodColors = {
  GET: "text-green-600",
  POST: "text-blue-600",
  PUT: "text-yellow-600",
  DELETE: "text-red-600",
  PATCH: "text-purple-600",
} as const;

export function Navigation({ items }: NavigationProps) {
  return (
    <nav className="space-y-0.5">
      {items.map((section) => (
        <div key={section.title} className="mb-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground font-semibold hover:bg-muted"
          >
            {section.title}
          </Button>
          {section.routes && section.routes.length > 0 && (
            <div className="space-y-0.5 pl-4">
              {section.routes.map((route) => (
                <Button
                  key={route.path}
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal hover:bg-muted"
                  title={route.summary}
                >
                  <span className={cn("mr-2 font-mono text-xs", methodColors[route.method as keyof typeof methodColors])}>
                    {route.method}
                  </span>
                  {route.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
} 