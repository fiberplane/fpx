import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import { Icon } from "@iconify/react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  Root,
} from "@radix-ui/react-dialog";
import FpLogo from "@/assets/fp-logo.svg";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@radix-ui/react-menubar";
import type React from "react";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { WebhoncBadge } from "../components/WebhoncBadge";
import { Button } from "../components/ui/button";
import { DialogPortal, DialogTitle } from "../components/ui/dialog";
import { useWebsocketQueryInvalidation } from "../hooks";
import { useProxyRequestsEnabled } from "../hooks/useProxyRequestsEnabled";
import { SettingsPage } from "../pages/SettingsPage/SettingsPage";
import { cn } from "../utils";
import { FloatingSidePanel } from "./FloatingSidePanel";

export function Layout({ children }: { children?: React.ReactNode }) {
  useWebsocketQueryInvalidation();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 max-w-128 overflow-hidden">
      <main
        className={cn("md:gap-8", "overflow-hidden", "h-[calc(100vh-40px)]")}
      >
        {children}
      </main>
      <BottomBar />
    </div>
  );
}

function Branding() {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <FpLogo className="w-4 h-4 text-muted-foreground/60 [&>path]:text-muted"/>
      <span className="text-sm text-muted-foreground/60">Fiberplane</span>
    </div>
  );
}

function BottomBar() {
  const shouldShowProxyRequests = useProxyRequestsEnabled();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { logsPanel, timelinePanel, aiPanel, togglePanel } = useRequestorStore(
    "togglePanel",
    "logsPanel",
    "timelinePanel",
    "aiPanel",
  );

  return (
    <nav className="gap-4 bg-muted/50 pb-2 pt-1">
      <div className="flex justify-between px-3 items-center">
        <div className="flex items-center gap-2 sm:static sm:h-auto border-0 bg-transparent text-sm">
          <SidePanelTrigger />
          <SettingsMenu setSettingsOpen={setSettingsOpen} />
          <FloatingSidePanel />
          <SettingsScreen
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
          <Branding />
          {/* <div className="ml-2"> */}
          {/*   <div className="flex items-center gap-2 text-sm" /> */}
          {/* </div> */}
        </div>

        <div className="flex items-center gap-2">
          {shouldShowProxyRequests && (
            <div className="ml-2">
              <WebhoncBadge />
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePanel("logsPanel")}
                className={cn("h-6 w-6")}
              >
                <Icon
                  icon="lucide:square-terminal"
                  className={cn(
                    "cursor-pointer h-4 w-4",
                    logsPanel === "open" && "text-blue-500",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
              align="center"
            >
              <p>Toggle logs</p>
              <div className="flex gap-1">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>L</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePanel("timelinePanel")}
                className={cn("h-6 w-6")}
              >
                <Icon
                  icon="lucide:align-start-vertical"
                  className={cn(
                    "cursor-pointer h-4 w-4",
                    timelinePanel === "open" && "text-blue-500",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
              align="center"
            >
              <p>Toggle timeline</p>
              <div className="flex gap-1 items-center">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>T</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePanel("aiPanel")}
                className={cn("h-6 w-6")}
              >
                <Icon
                  icon="lucide:sparkles"
                  className={cn(
                    "cursor-pointer h-4 w-4",
                    aiPanel === "open" && "text-blue-500",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
              align="center"
            >
              <p>Toggle AI test panel</p>
              <div className="flex gap-1 items-center">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>I</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}

function SidePanelTrigger() {
  const { sidePanel, togglePanel } = useRequestorStore(
    "sidePanel",
    "togglePanel",
  );

  useHotkeys("mod+b", () => {
    togglePanel("sidePanel");
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="p-0.5 w-6 h-6"
      onClick={() => togglePanel("sidePanel")}
    >
      <Icon
        icon={`lucide:panel-left-${sidePanel === "open" ? "close" : "open"}`}
      />
    </Button>
  );
}

function MenuItemLink({
  href,
  icon,
  children,
}: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <MenubarItem className="pointer-cursor-auto px-2 py-1 select-none focus:bg-accent focus:text-accent-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        {icon}
        {children}
      </a>
    </MenubarItem>
  );
}

function SettingsMenu({
  setSettingsOpen,
}: { setSettingsOpen: (open: boolean) => void }) {
  const menuBarTriggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState<true | undefined>(undefined);

  useHotkeys("shift+?", () => {
    setMenuOpen(true);
    if (menuBarTriggerRef.current) {
      menuBarTriggerRef.current.click();
    }
  });

  return (
    <Menubar className="p-0">
      <MenubarMenu>
        <MenubarTrigger
          ref={menuBarTriggerRef}
          className="w-6 h-6 p-0.5 rounded-md hover:bg-muted flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <Icon icon="lucide:settings" />
        </MenubarTrigger>
        <MenubarContent
          onEscapeKeyDown={() => setMenuOpen(undefined)}
          onInteractOutside={() => setMenuOpen(undefined)}
          forceMount={menuOpen}
          className="z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md grid gap-1 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <MenuItemLink
            href="https://fiberplane.com/docs/get-started"
            icon={<Icon icon="lucide:book-open" />}
          >
            Docs
          </MenuItemLink>
          <MenuItemLink
            href="https://github.com/fiberplane/fpx"
            icon={<GitHubLogoIcon className="w-3.5 h-3.5" />}
          >
            GitHub
          </MenuItemLink>
          <MenuItemLink
            href="https://discord.com/invite/cqdY6SpfVR"
            icon={<DiscordLogoIcon className="w-3.5 h-3.5" />}
          >
            Discord
          </MenuItemLink>
          <MenubarSeparator className="h-px bg-muted" />
          <MenubarItem
            className="pointer-cursor-auto px-2 py-1 select-none focus:bg-accent focus:text-accent-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={() => setSettingsOpen(true)}
          >
            <div className="flex items-center gap-2">
              <Icon icon="lucide:settings-2" />
              Settings
            </div>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function SettingsScreen({
  settingsOpen,
  setSettingsOpen,
}: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void }) {
  return (
    <Root open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogPortal>
        <DialogContent className="fixed top-0 left-0 w-full h-full z-50">
          <div className="h-full grid bg-background items-start justify-center">
            <div className="pr-1 overflow-hidden w-full lg:max-w-[1060px] md:max-w-[1100px] grid grid-rows-[auto_1fr]">
              <div className="flex justify-between items-center px-8 pr-8 lg:px-12 lg:pr-10 pt-6">
                <DialogTitle>Settings</DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
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
      </DialogPortal>
    </Root>
  );
}

export default Layout;
