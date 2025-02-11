import { cn } from "@/utils";
import { BACKGROUND_LAYER } from "../styles";

export function NavigationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        BACKGROUND_LAYER,
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
