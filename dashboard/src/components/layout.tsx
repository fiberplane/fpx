import { ChartSpline, Home, Key } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Route, Routes, useMatch } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";

export function Layout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarNavLink href="/">
                    <Home />
                    <span>Dashboard</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/insights">
                    <ChartSpline />
                    <span>Insights</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/tokens">
                    <Key />
                    <span>Tokens</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Fiberplane</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <Routes>
                    <Route
                      path="/"
                      element={<BreadcrumbPage>Dashboard</BreadcrumbPage>}
                    />
                    <Route
                      path="tokens"
                      element={<BreadcrumbPage>Tokens</BreadcrumbPage>}
                    />
                    <Route
                      path="insights"
                      element={<BreadcrumbPage>Insights</BreadcrumbPage>}
                    />
                  </Routes>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="m-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function SidebarNavLink({
  children,
  href,
}: PropsWithChildren<{ href: string }>) {
  const match = useMatch(href);

  return (
    <SidebarMenuButton asChild isActive={match !== null}>
      <a href={href}>{children}</a>
    </SidebarMenuButton>
  );
}
