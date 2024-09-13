import { useRequestorStore } from "@/pages/RequestorPage/store";
import { Icon } from "@iconify/react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  Root,
} from "@radix-ui/react-dialog";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import type React from "react";
import type { ComponentProps } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { NavLink } from "react-router-dom";
import FpxIcon from "../assets/fpx.svg";
import { WebhoncBadge } from "../components/WebhoncBadge";
import { Button } from "../components/ui/button";
import { DialogTitle } from "../components/ui/dialog";
import { useWebsocketQueryInvalidation } from "../hooks";
import { useProxyRequestsEnabled } from "../hooks/useProxyRequestsEnabled";
import { SettingsPage } from "../pages/SettingsPage/SettingsPage";
import { cn } from "../utils";
import { FloatingSidePanel } from "./FloatingSidePanel";

const Branding = () => {
  return (
    <div>
      <FpxIcon height="20px" width="20px" />
    </div>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  // Will add new fpx-requests as they come in by refetching
  // In the future, we'll want to build a better ux around this (not auto refresh the table)
  //
  // This should be used only at the top level of the app to avoid unnecessary re-renders
  useWebsocketQueryInvalidation();

  const shouldShowProxyRequests = useProxyRequestsEnabled();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128 overflow-hidden">
      <nav className="flex gap-4 sm:gap-4 py-2 sm:py-2 justify-between items-center border-b">
        <div className="sticky top-0 flex items-center gap-2 px-4 sm:static sm:h-auto border-0 bg-transparent md:px-6 text-sm">
          <SidePanelTrigger />
          <FloatingSidePanel />
          <HeaderNavLink to="/">
            <Branding />
          </HeaderNavLink>
          <div className="ml-2">
            <div className="flex items-center gap-2 text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shouldShowProxyRequests && (
            <div className="ml-2">
              <WebhoncBadge />
            </div>
          )}
          <div className="flex items-center border-l gap-1 px-1">
            <Root>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
                  <Icon icon="lucide:settings" />
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed top-0 left-0 w-full h-full z-50">
                <div className="h-full grid bg-background items-start justify-center">
                  <div className="pr-1 overflow-hidden w-full lg:max-w-[1060px] md:max-w-[1100px] grid grid-rows-[auto_1fr]">
                    <div className="flex justify-between items-center px-8 pr-8 lg:px-12 lg:pr-10 pt-6">
                      <DialogTitle>Settings</DialogTitle>
                      <DialogClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="p-0.5 w-6 h-6"
                        >
                          <Icon icon="lucide:x" />
                        </Button>
                      </DialogClose>
                    </div>
                    <div>
                      <DialogDescription className="px-8 pr-8 lg:px-12 lg:pr-10 pt-6 text-sm text-muted-foreground">
                        Manage your settings and preferences.
                      </DialogDescription>

                      <SettingsPage />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Root>
            <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
              <a
                href="https://github.com/fiberplane/fpx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubLogoIcon className="w-3.5 h-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
              <a
                href="https://discord.com/invite/cqdY6SpfVR"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordLogoIcon className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </nav>
      <main
        className={cn("md:gap-8", "overflow-hidden", "h-[calc(100vh-40px)]")}
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
        `rounded ${isActive ? "bg-muted" : ""} inline-block py-1 px-2 hover:underline text-xs`
      }
    />
  );
};

const SidePanelTrigger = () => {
  const { sidePanelOpen, setSidePanelOpen } = useRequestorStore(
    "sidePanelOpen",
    "setSidePanelOpen",
  );

  useHotkeys("mod+b", () => {
    setSidePanelOpen(!sidePanelOpen);
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="p-0.5 w-6 h-6"
      onClick={() => setSidePanelOpen(!sidePanelOpen)}
    >
      <Icon icon={`lucide:panel-left-${sidePanelOpen ? "close" : "open"}`} />
    </Button>
  );
};

export default Layout;
