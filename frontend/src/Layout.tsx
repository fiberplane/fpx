import type React from "react";
import { NavLink } from "react-router-dom";
import WaveIcon from "./Wave.svg";
import FpxIcon from "./fpx.svg";

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
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128">
      <nav className="flex gap-4 sm:gap-4 py-4 sm:py-0 justify-between items-center h-[64px] border-b ">
        <div className="sticky top-0 flex items-center gap-2 px-4 sm:static sm:h-auto border-0 bg-transparent sm:px-6 py-2 text-sm">
          <Branding />
          <div className="ml-2">
            <div className="flex items-center gap-2 text-sm">
              <HeaderNavLink to="/requestor">Routes</HeaderNavLink>
              <HeaderNavLink to="/requests">Requests</HeaderNavLink>
              <HeaderNavLink to="/settings">Settings</HeaderNavLink>
              {/* <HeaderNavLink to="/issues">Issues</HeaderNavLink> */}
            </div>
          </div>
          {/* TODO - Breadcrumbs */}
        </div>
      </nav>
      <div className="flex-grow flex flex-col sm:gap-4 py-1 pb-2">
        {/* <header className="py-2 pb-3 sticky top-0 z-30 flex items-center gap-2 border-b bg-background px-4 sm:static sm:h-auto sm:bg-transparent sm:px-6 text-sm">
          <HeaderNavLink to="/requestor">Routes</HeaderNavLink>
          <HeaderNavLink to="/requests">Requests</HeaderNavLink>
          <HeaderNavLink to="/issues">Issues</HeaderNavLink>
        </header> */}
        <main className="grid flex-1 items-start gap-4 py-2 px-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const HeaderNavLink = (props: ComponentProps<NavLink>) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `rounded ${isActive ? "bg-muted" : ""} inline-block py-2 px-4`
      }
    />
  );
};

export default Layout;
