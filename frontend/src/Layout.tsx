import type React from "react";
import { ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import { Status } from "./components/ui/status";
import FpxIcon from "./fpx.svg";
import { useRequestDetails } from "./hooks";
import { RequestMethod } from "./pages/RequestDetailsPage/shared";
import { useMizuTraces } from "./queries";
import { cn } from "./utils";

const Branding = () => {
  return (
    <div>
      <FpxIcon height="32px" width="32px" />
    </div>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128 overflow-hidden">
      <nav className="flex gap-4 sm:gap-4 py-4 sm:py-0 justify-between items-center h-[64px] border-b">
        <div className="sticky top-0 flex items-center gap-2 px-4 sm:static sm:h-auto border-0 bg-transparent md:px-6 py-2 text-sm">
          <Branding />
          <div className="ml-2">
            <div className="flex items-center gap-2 text-sm">
              <HeaderNavLink to="/requestor">Routes</HeaderNavLink>
              <RequestLink />
              {/* <HeaderNavLink to="/settings">Settings</HeaderNavLink> */}
              {/* <HeaderNavLink to="/issues">Issues</HeaderNavLink> */}
            </div>
          </div>
        </div>
      </nav>
      <main
        className={cn("md:gap-8", "overflow-hidden", "h-[calc(100vh-64px)]")}
      >
        <Outlet />
      </main>
    </div>
  );
};

const RequestLink = ({ props }: { props?: ComponentProps<typeof NavLink> }) => {
  const { traceId } = useParams();
  const { trace } = useRequestDetails(traceId);
  const { data: traces, isLoading, isFetching } = useMizuTraces();

  const mostRecentRequest = useMemo(() => traces?.find(
    (t) => t.method === trace?.method && t.path === trace?.path,
  ), [traces, trace]);

  const [isMostRecent, setIsMostRecent] = useState(true);

  const checkMostRecentRequest = useCallback(() => trace?.id === mostRecentRequest?.id, [trace, mostRecentRequest])

  useEffect(() => {
    console.log("isFetching", isFetching)
    console.log("isLoading", isLoading)
    console.log("TRACES CHANGED", traces)
  }, [traces, isFetching, isLoading])

  useEffect(() => {
    setIsMostRecent(checkMostRecentRequest());
  }, [checkMostRecentRequest]);

  if (!traceId && !trace) {
    return (
      <HeaderNavLink {...props} to="/requests">
        Requests
      </HeaderNavLink>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <NavLink className="pl-4 py-2 text-white" to="/requests">
            Requests
          </NavLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <NavLink
            to={`/requests/${traceId}`}
            className="rounded bg-muted px-4 py-2 flex gap-2 items-center text-white"
          >
            {trace && <RequestMethod method={trace?.method} />}
            <span>{trace?.path}</span>
            <Status statusCode={Number(trace?.status)} />
          </NavLink>
        </BreadcrumbItem>
        {!isMostRecent && (
          <BreadcrumbItem className="ml-4">
            <NavLink to={`/requests/${mostRecentRequest?.id}`}>
              <span className="text-white bg-blue-800 px-4 py-2 rounded">
                Go to the most recent response
              </span>
            </NavLink>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
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
