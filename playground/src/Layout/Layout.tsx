import { useStudioStore } from "@/components/playground/store";
import { Button } from "@/components/ui/button";
import { createLink, useMatches } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../utils";
import { BottomBar } from "./BottomBar";
import { SettingsScreen } from "./Settings";

const NavButtonComponent = ({
  className,
  ...props
}: React.ComponentProps<"a">) => {
  const matches = useMatches();
  const isActive = matches.some((match) => match.routeId === props.href);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-6 hover:bg-input", isActive && "bg-input")}
      asChild
    >
      <a {...props} className={cn(className)} />
    </Button>
  );
};

const NavButton = createLink(NavButtonComponent);

export function Layout({ children }: { children?: ReactNode }) {
  const { isWorkflowsEnabled, isTracingEnabled, shouldShowTopNav } =
    useStudioStore(
      "isWorkflowsEnabled",
      "isTracingEnabled",
      "shouldShowTopNav",
    );

  return (
    <div className="flex flex-col justify-between w-full min-h-screen overflow-hidden bg-muted/30 max-w-128">
      {shouldShowTopNav && (
        <div className="grid grid-cols-[1fr_auto] mt-1 px-4 items-center h-6 place-items-center">
          <div className="flex items-center gap-2">
            <NavButton to="/">Playground</NavButton>
            {isWorkflowsEnabled && (
              <NavButton to="/workflows">Workflows</NavButton>
            )}
            {isTracingEnabled && <NavButton to="/traces">Traces</NavButton>}
          </div>
          <div>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <UserCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <main
        className={cn(
          "md:gap-8",
          "overflow-hidden",
          shouldShowTopNav ? "h-[calc(100vh-70px)]" : "h-[calc(100vh-40px)]",
        )}
      >
        {children}
      </main>
      <BottomBar />
      <SettingsScreen />
    </div>
  );
}

export default Layout;
