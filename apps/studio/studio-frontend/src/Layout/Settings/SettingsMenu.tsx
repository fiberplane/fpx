import { FP_SERVICES_LOGIN_URL } from "@/constants";
import { useLogout, useUserInfo } from "@/queries";
import { Icon } from "@iconify/react";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@radix-ui/react-menubar";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export function SettingsMenu({
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

  const user = useUserInfo();

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
          {user ? <LogOut /> : <GitHubLogInLink />}
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

function LogOut() {
  const logout = useLogout();

  return (
    <MenubarItem
      className="pointer-cursor-auto px-2 py-1 select-none focus:bg-accent focus:text-accent-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
      onClick={() => !logout.isPending && logout.mutate()}
    >
      <div className="flex items-center gap-2">
        <Icon icon="lucide:user" />
        {logout.isPending ? "Logging you out" : "Log out"}
      </div>
    </MenubarItem>
  );
}

function GitHubLogInLink() {
  return (
    <MenuItemLink
      href={FP_SERVICES_LOGIN_URL}
      icon={<Icon icon="lucide:user" />}
    >
      Log In
    </MenuItemLink>
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
