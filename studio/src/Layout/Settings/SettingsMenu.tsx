import { Icon } from "@iconify/react/dist/iconify.js";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@radix-ui/react-menubar";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  SignedIn,
  SignedOut,
  SignOutButton,
  // useClerk,
  useAuth,
  // useSignIn,
  // useUser,
} from "@clerk/clerk-react";
import { MenuItemAnchor, MenuItemButton, MenuItemLink } from "./shared";

export function SettingsMenu({
  setSettingsOpen,
}: { setSettingsOpen: (open: boolean) => void }) {
  const menuBarTriggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState<true | undefined>(undefined);
  // const { signIn } = useSignIn();

  const { signOut } = useAuth();

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
          <MenuItemAnchor
            href="https://fiberplane.com/docs/get-started"
          >
            <Icon icon="lucide:book-open" />
            Docs
          </MenuItemAnchor>
          <MenuItemAnchor
            href="https://github.com/fiberplane/fpx"
          >
            <GitHubLogoIcon className="w-3.5 h-3.5" />
            GitHub
          </MenuItemAnchor>
          <MenuItemAnchor
            href="https://discord.com/invite/cqdY6SpfVR"
          >
            <DiscordLogoIcon className="w-3.5 h-3.5" />
            Discord
          </MenuItemAnchor>
          <MenubarSeparator className="h-px bg-muted" />
          <MenuItemButton
            onSelect={() => setSettingsOpen(true)}
          >
            <Icon icon="lucide:settings-2" />
            Settings
          </MenuItemButton>
          <SignedIn>
            <MenuItemLink to="/account">
              <Icon icon="lucide:user" />
              Account
            </MenuItemLink>
          </SignedIn>
          <MenubarSeparator className="h-px bg-muted" />
          <SignedOut>
            <MenuItemLink to="/sign-in">
              <Icon icon="lucide:log-in" />
              Sign in
            </MenuItemLink>
          </SignedOut>
          <SignedIn>
            <SignOutButton>
              <MenuItemButton onSelect={() => signOut()}>
                <Icon icon="lucide:log-out" />
                Sign out
              </MenuItemButton>
            </SignOutButton>
          </SignedIn>
          {/* <MenubarItem
            className="pointer-cursor-auto px-2 py-1 select-none focus:bg-accent focus:text-accent-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={() => {
              if (signIn && !isSignedIn) {
                signIn.create({
                  // strategy: "oauth_github",
                });
              } else {
                signOut()
                  .then(() => console.log("done"))
                  .catch(err => console.error("error", err));
              }
            }
            }
          >
            {signIn ? "Sign out" : "Sign in"}
          </MenubarItem> */}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

// function MenUItemLink(
//   to: To
// )
