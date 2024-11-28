import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/pages/RequestorPage/store";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useHotkeys } from "react-hotkeys-hook";

export function SidePanelTrigger() {
  const { sidePanel, togglePanel } = useStudioStore("sidePanel", "togglePanel");

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
