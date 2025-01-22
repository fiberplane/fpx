import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { SettingsPage } from "../../garbage/RequestorPage/Settings/SettingsPage";

export function SettingsScreen({
  settingsOpen,
  setSettingsOpen,
}: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void }) {
  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogPortal>
        <DialogContent className="fixed top-0 left-0 right-0 w-full overflow-hidden z-50 bg-background h-screen">
          <div className="grid grid-rows-[auto_1fr] mx-auto h-full w-full md:max-w-[1100px] lg:max-w-[1060px]">
            <div>
              <div className="flex justify-between items-center px-8 pt-6">
                <DialogTitle>Settings</DialogTitle>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 p-0.5 text-foreground/70 hover:text-foreground hover:bg-transparent transition-colors"
                  >
                    <Icon icon="lucide:x" />
                  </Button>
                </DialogClose>
              </div>
              <DialogDescription className="px-8 pt-2 text-sm text-muted-foreground">
                Manage your settings and preferences.
              </DialogDescription>
            </div>

            <SettingsPage />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
