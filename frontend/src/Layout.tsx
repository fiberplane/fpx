import type React from "react";
import { NavLink } from "react-router-dom";
import WaveIcon from "./Wave.svg";

const Branding = () => {
  return (
    <div>
      <WaveIcon height="32px" width="32px" />
    </div>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128">
      <nav className="flex gap-4 sm:gap-4 py-4 sm:py-0 justify-between items-center h-[64px] border-b ">
        <div className="sticky top-0 flex items-center gap-2 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 text-sm">
          <Branding />
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `rounded ${isActive ? "bg-muted" : ""} inline-block py-2.5 px-4`
            }
          >
            Requests
          </NavLink>
          <NavLink
            to="/issues"
            className={({ isActive }) =>
              `rounded-sm ${isActive ? "bg-muted" : ""} inline-block py-2.5 px-4`
            }
          >
            Issues
          </NavLink>
        </div>
      </nav>
      <div className="flex flex-col sm:gap-4 sm:py-2">
        {/* <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 text-sm">
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `rounded ${isActive ? "bg-muted" : ""} inline-block py-2.5 px-4`
            }
          >
            Requests
          </NavLink>
          <NavLink
            to="/issues"
            className={({ isActive }) =>
              `rounded-sm ${isActive ? "bg-muted" : ""} inline-block py-2.5 px-4`
            }
          >
            Issues
          </NavLink>
        </header> */}
        <main className="grid flex-1 items-start gap-4 py-2 px-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;