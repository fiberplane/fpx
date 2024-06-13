import { AvatarIcon as UserIcon } from "@radix-ui/react-icons";
import type React from "react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Layout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128">
      <nav className="flex gap-4 sm:gap-4 py-4 sm:py-0 justify-between items-center">
        <div className="sticky top-0 flex items-center gap-2 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `rounded ${isActive ? "bg-neutral-200" : ""} inline-block p-2`
            }
          >
            Requests
          </NavLink>
          <NavLink
            to="/issues"
            className={({ isActive }) =>
              `rounded-sm ${isActive ? "bg-neutral-200" : ""} inline-block p-2`
            }
          >
            Issues
          </NavLink>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <UserIcon
                width={36}
                height={36}
                className="overflow-hidden rounded-full text-gray-400"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"></header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
