import { useSettingsOpen } from "@/hooks";
import { SettingsMenu, SettingsScreen } from "../Settings";
import { FloatingSidePanel } from "../SidePanel";
import { SidePanelTrigger } from "../SidePanel";

export function BottomBar() {
  const { setSettingsOpen, settingsOpen } = useSettingsOpen();
  return (
    <nav className="gap-4 bg-muted/50 py-2">
      <div className="flex justify-between px-2 items-center">
        <div className="flex items-center gap-2 sm:static sm:h-auto border-0 bg-transparent text-sm">
          <div className="flex items-center gap-2">
            <SidePanelTrigger />
            <SettingsMenu setSettingsOpen={setSettingsOpen} />
          </div>
          <FloatingSidePanel />
          <SettingsScreen
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* this is where the logs, timeline, ai stuff was previously... */}
        </div>
      </div>
    </nav>
  );
}
