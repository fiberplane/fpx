import { SettingsPage } from "@/components/playground/Settings/SettingsPage";
import { Button } from "@/components/ui/button";
import { useSettingsOpen } from "@/hooks";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from "@radix-ui/react-dialog";

export function SettingsScreen() {
  const { setSettingsOpen, settingsOpen } = useSettingsOpen();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogPortal>
        <DialogContent className="fixed top-0 left-0 right-0 w-full overflow-hidden overflow-y-auto z-50 bg-background h-screen">
          <div className="grid grid-rows-[auto_1fr] mx-auto h-screen w-full md:max-w-[1100px] lg:max-w-[1060px]">
            <div className="sticky top-0 bg-background shadow-sm">
              <div className="flex justify-between items-center px-8 pt-6 pb-4">
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
            </div>

            <SettingsPage />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
