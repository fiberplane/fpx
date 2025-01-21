import type React from "react";
import { cn } from "../utils";
import { BottomBar } from "./BottomBar";

export function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-muted/30 max-w-128 overflow-hidden">
      <main
        className={cn("md:gap-8", "overflow-hidden", "h-[calc(100vh-40px)]")}
      >
        {children}
      </main>
      <BottomBar />
    </div>
  );
}

export default Layout;
