import { cn } from "@/utils";
import { MenubarItem } from "@radix-ui/react-menubar";
import { useRef } from "react";
import { useNavigate, type To, resolvePath } from "react-router-dom";

const twoColumnLayout = cn(
  "px-2 py-1",
  "flex items-center gap-2",

  "pointer-cursor-auto select-none cursor-pointer ",
  "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-blue-500",
);

export function MenuItemAnchor({
  href,
  children,
}: { href: string; children: React.ReactNode }) {
  const link = useRef<HTMLAnchorElement>(null);
  return (
    <MenubarItem onSelect={() => link.current?.click()}>
      <a
        ref={link}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={twoColumnLayout}
      >
        {children}
      </a>
    </MenubarItem>
  );
}

export function MenuItemLink({
  to,
  children,
}: { to: To; children: React.ReactNode }) {
  const navigate = useNavigate();
  const path = resolvePath(to);
  const onSelect = () => {
    navigate(to);
  };

  const ref = useRef<HTMLDivElement>(null);
  return (
    <MenubarItem ref={ref} onSelect={onSelect}>
      <a
        onClick={(event) => {
          event.preventDefault();
          ref.current?.click();
        }}
        href={`${path.pathname}${path.search ? path.search : ""}`}
        className={twoColumnLayout}
      >
        {children}
      </a>
    </MenubarItem>
  );
}

export function MenuItemButton({
  onSelect,
  children,
}: { onSelect: () => void; children: React.ReactNode }) {
  return (
    <MenubarItem onSelect={onSelect}>
      <div className={twoColumnLayout}>{children}</div>
    </MenubarItem>
  );
}
