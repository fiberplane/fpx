import { cn } from "@/utils";
import { BACKGROUND_LAYER } from "../styles";
import { RoutesPanel } from "./RoutesPanel";

export function NavigationPanel() {
  return (
    <div
      className={cn(
        BACKGROUND_LAYER,
        "px-4 overflow-hidden border rounded-md",
        "h-full",
        "flex",
        "flex-col",
      )}
    >
      <RoutesPanel />
    </div>
  );
}
