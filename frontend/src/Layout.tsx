import type React from "react";
import { ComponentProps } from "react";
import { NavLink } from "react-router-dom";
import FpxIcon from "./assets/fpx.svg";
import { cn } from "./utils";

const Branding = () => {
  return (
    <div>
      <FpxIcon height="32px" width="32px" />
    </div>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128 overflow-hidden">
      <nav className="flex gap-4 sm:gap-4 py-4 sm:py-0 justify-between items-center h-[64px] border-b">
        <div className="sticky top-0 flex items-center gap-2 px-4 sm:static sm:h-auto border-0 bg-transparent md:px-6 py-2 text-sm">
          <Branding />
          <div className="ml-2">
            <div className="flex items-center gap-2 text-sm">
              <HeaderNavLink to="/requestor">Routes</HeaderNavLink>
              <HeaderNavLink to="/requests">Requests</HeaderNavLink>
              <HeaderNavLink to="/settings">Settings</HeaderNavLink>
              {/* <HeaderNavLink to="/issues">Issues</HeaderNavLink> */}
            </div>
          </div>
        </div>
      </nav>
      <main
        className={cn("md:gap-8", "overflow-hidden", "h-[calc(100vh-64px)]")}
      >
        {children}
      </main>
    </div>
  );
};

const HeaderNavLink = (props: ComponentProps<typeof NavLink>) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `rounded ${isActive ? "bg-muted" : ""} inline-block py-2 px-4 hover:underline`
      }
    />
  );
};

export default Layout;
