import type React from "react";
import { cn } from "./lib/utils";

export function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between max-w-128">
      <main
        className={cn("px-2", "md:gap-8")}
      >
        {children}
      </main>
    </div>
  );
}
