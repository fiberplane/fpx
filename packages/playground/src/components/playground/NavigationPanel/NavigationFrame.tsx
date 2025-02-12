import { cn } from "@/utils";

export function NavigationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "px-4 overflow-hidden border rounded-md",
        "h-full",
        "flex",
        "flex-col",
        "pt-4",
      )}
    >
      {children}
    </div>
  );
}
