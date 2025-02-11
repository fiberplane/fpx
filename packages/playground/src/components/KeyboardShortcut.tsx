import { cn } from "@/lib/utils";

export const KeyboardShortcutKey = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return (
    <kbd
      className={cn(
        "flex border items-center text-xs justify-center",
        "font-mono bg-secondary text-secondary-foreground",
        "p-0.5 rounded h-4 min-w-4",
        className,
      )}
    >
      {children}
    </kbd>
  );
};
