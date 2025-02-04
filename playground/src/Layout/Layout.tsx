import { useStudioStore } from "@/components/playground/store";
import { Button } from "@/components/ui/button";
import { Link, useMatches } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "../utils";
import { BottomBar } from "./BottomBar";
import { SettingsScreen } from "./Settings";

function NavButton({
  to,
  children,
}: { to: string; children: React.ReactNode }) {
  const matches = useMatches();
  const isActive = matches.some((match) => match.routeId === to);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-6 hover:bg-input", isActive && "bg-input")}
      asChild
    >
      <Link to={to}>{children}</Link>
    </Button>
  );
}

export function Layout({ children }: { children?: React.ReactNode }) {
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
              <NavButton to="/workflow">Workflows</NavButton>
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
