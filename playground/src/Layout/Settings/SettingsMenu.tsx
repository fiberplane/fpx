import { useStudioStore } from "@/garbage/RequestorPage/store";
import { Icon } from "@iconify/react";
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
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

export function SettingsMenu({
  setSettingsOpen,
}: { setSettingsOpen: (open: boolean) => void }) {
  const menuBarTriggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState<true | undefined>(undefined);
  const { shortcutsOpen, setShortcutsOpen } = useStudioStore(
    "shortcutsOpen",
    "setShortcutsOpen",
  );

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
          <MenubarItem
            className="pointer-cursor-auto px-2 py-1 select-none focus:bg-secondary focus:text-secondary-foreground cursor-pointer focus:outline-none focus:ring-1 rounded-lg"
            onClick={() => setShortcutsOpen(true)}
          >
            <div className="flex items-center gap-2">
              <Icon icon="lucide:book-open" />
              Keyboard Shortcuts
            </div>
          </MenubarItem>
          <MenubarSeparator className="h-px bg-muted" />
          <MenubarItem
            className="pointer-cursor-auto px-2 py-1 select-none focus:bg-secondary focus:text-secondary-foreground cursor-pointer focus:outline-none focus:ring-1 rounded-lg"
            onClick={() => setSettingsOpen(true)}
          >
            <div className="flex items-center gap-2">
              <Icon icon="lucide:settings-2" />
              Settings
            </div>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </Menubar>
  );
}

function MenuItemLink({
  href,
  icon,
  children,
}: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <MenubarItem className="pointer-cursor-auto px-2 py-1 select-none focus:bg-secondary focus:text-secondary-foreground cursor-pointer focus:outline-none focus:ring-1 rounded-lg">
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
