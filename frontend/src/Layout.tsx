import type React from 'react';
import { NavLink, Link as RouterLink, matchPath, useLocation, useMatch, useMatches, useParams } from 'react-router-dom';
import {
  ActivityLogIcon,
  DashboardIcon,
  BarChartIcon as LineChart, // FIXME
  CubeIcon as Package,
  MagnifyingGlassIcon as Search,
  LayoutIcon as PanelLeft,
  AvatarIcon as UserIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Fragment, useMemo, type SVGProps } from 'react';

const WaveIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Wave Icon</title>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 7.5 Q 3.75 0, 7.5 7.5 T 15 7.5 M0 22.5 Q 3.75 15, 7.5 22.5 T 15 22.5"
    />
  </svg>
)

const getPathSegments = (pathname: string) => {
  if (pathname === '/') return ['/'];
  const segments = pathname.split('/').filter(Boolean);
  const paths = segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`);
  return paths;
};

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/packages': 'Packages',
  '/requests': 'Requests',
  '/requests/:traceId': 'Request Details',
};

// TODO - Check out React Router useMatches
//        https://reactrouter.com/en/main/hooks/use-matches
//
const MizuBreadcrumbs: React.FC = () => {
  const location = useLocation();
  // NOTE - Do not use useParams here since layout is not a child of the Route and won't pick up on params
  // const params = useParams();

  const paths = getPathSegments(location.pathname);
  const breadcrumbs = useMemo(() => {
    return paths.map((path) => {
      const matchingPathPattern = Object.keys(breadcrumbMap).find((pathPattern) => matchPath(pathPattern, path))
      if (matchingPathPattern) {
        return { path, label: breadcrumbMap[matchingPathPattern] };
      }
      return null;
    }).filter(Boolean);
  }, [paths]);

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => crumb && (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <RouterLink to={crumb.path}>{crumb.label}</RouterLink>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <NavLink
            to="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <WaveIcon className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Mizu</span>
          </NavLink>
          <Tooltip>
            <TooltipTrigger>
              <RouterLink
                to="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <DashboardIcon className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </RouterLink>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard (not implemented)</TooltipContent>
          </Tooltip>
          {/* <Tooltip>
            <NavLink
              to="/logs"
              className={({ isActive, }) => {
                return `${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"} flex h-9 w-9 items-center justify-center rounded-lg text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8`
              }}
            >
              <TooltipTrigger asChild>
                <div>
                  <ActivityLogIcon className="h-5 w-5" />
                  <span className="sr-only">Logs</span>
                </div>
              </TooltipTrigger>
            </NavLink>
            <TooltipContent side="right">Logs</TooltipContent>
          </Tooltip> */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <LineChart className="h-5 w-5" />
                <span className="sr-only">Metrics</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Metrics</TooltipContent>
          </Tooltip> */}
          <Tooltip>
            <NavLink
              to="/requests"
              className={({ isActive, }) => {
                return `${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"} flex h-9 w-9 items-center justify-center rounded-lg text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8`
              }}
            >
              <TooltipTrigger asChild>
                <div>
                  <MixerHorizontalIcon className="h-5 w-5" />
                  <span className="sr-only">Requests</span>
                </div>
              </TooltipTrigger>
            </NavLink>
            <TooltipContent side="right">Requests</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/packages"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Package className="h-5 w-5" />
                <span className="sr-only">Packages</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Packages</TooltipContent>
          </Tooltip>
        </nav>

      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <NavLink
                  to="/"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <WaveIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Mizu</span>
                </NavLink>
                <NavLink
                  to="/"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <DashboardIcon className="h-5 w-5" />
                  Mizu
                </NavLink>
                <NavLink
                  to="#"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ActivityLogIcon className="h-5 w-5" />
                  Logs
                </NavLink>
                <NavLink
                  to="#"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <LineChart className="h-5 w-5" />
                  Metrics
                </NavLink>
                <NavLink
                  to="/packages"
                  className="flex items-center gap-4 px-2.5 text-foreground"
                >
                  <Package className="h-5 w-5" />
                  Packages
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>
          <MizuBreadcrumbs />
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
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
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
