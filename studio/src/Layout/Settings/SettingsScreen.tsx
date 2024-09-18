import { Button } from "@/components/ui/button";
import { SettingsPage } from "@/pages/SettingsPage";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Dialog,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@radix-ui/react-dialog";

export function SettingsScreen({
  settingsOpen,
  setSettingsOpen,
}: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void }) {
  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogPortal>
        <DialogContent className="fixed top-0 left-0 w-full h-full z-50">
          <div className="h-full grid bg-background items-start justify-center">
            <div className="pr-1 overflow-hidden w-full lg:max-w-[1060px] md:max-w-[1100px] grid grid-rows-[auto_1fr]">
              <div className="flex justify-between items-center px-8 pr-8 lg:px-12 lg:pr-10 pt-6">
                <DialogTitle>Settings</DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
                    <Icon icon="lucide:x" />
                  </Button>
                </DialogClose>
              </div>
              <div>
                <DialogDescription className="px-8 pr-8 lg:px-12 lg:pr-10 pt-6 text-sm text-muted-foreground">
                  Manage your settings and preferences.
                </DialogDescription>

                <SettingsPage />
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
