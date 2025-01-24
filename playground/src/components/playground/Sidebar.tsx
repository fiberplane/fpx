import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Link,
  // useMatches,
  useRouter,
} from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { ModeToggle } from "../mode-toggle";
// import { Navigation } from "./Navigation";
// import { getNavigationData } from "./navigation-data";

export function Sidebar() {
  const router = useRouter();
  // const matches = useMatches();
  // const isIndexRoute = matches.some((match) => match.routeId === "/");

  const routes = [
    { path: "/", label: "API Docs" },
    { path: "/workflow", label: "Workflow" },
  ];

  const currentRoute =
    routes.find((route) => route.path === router.state.location.pathname) ??
    routes[0];
  // const navigationItems = isIndexRoute ? getNavigationData() : [];

  return (
    <aside className="grid min-h-screen grid-rows-[auto_1fr] gap-6 p-4 border-r border-border">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <div className="grid w-8 h-8 font-semibold rounded place-items-center bg-primary text-primary-foreground">
            fpx
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="grid grid-cols-[1fr_auto] items-center gap-1 px-1 py-0.5 rounded hover:bg-accent">
              <span className="font-semibold text-foreground">
                {currentRoute.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {routes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <Link to={route.path} className="cursor-pointer">
                    {route.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ModeToggle />
      </div>

      <div className="grid gap-6">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search"
            className="w-full pr-12 bg-white"
          />
          <kbd className="pointer-events-none absolute right-3 top-2.5 h-5 select-none grid grid-flow-col items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* {isIndexRoute && <Navigation items={navigationItems} />} */}
      </div>
    </aside>
  );
}
