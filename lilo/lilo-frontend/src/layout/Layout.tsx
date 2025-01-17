import type React from "react";
import { cn } from "../lib/utils";
import { UserNav } from "./UserNav";

export function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-screen flex-col justify-between">
      <nav className="bg-white shadow-md py-4 flex justify-between items-center px-8">
        <div className="">
          <h1 className="text-xl font-bold">Lilo</h1>
        </div>
        <div className="flex items-center gap-6">
          <a href="/reference">API Reference</a>
          <div className="border-l pl-6 flex items-center">
            <UserNav />
          </div>
        </div>
      </nav>
      <main className={cn("flex-grow w-full px-4 py-6")}>{children}</main>
      <footer className="bg-gray-100 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Made with ❤️ by{" "}
            <a
              href="https://fiberplane.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Fiberplane
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
