import {
  NavigationFrame,
  NavigationPanel,
} from "@/components/playground/NavigationPanel";
import { useStudioStore } from "@/components/playground/store";
import { Button } from "@/components/ui/button";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Root,
} from "@radix-ui/react-dialog";

export function FloatingSidePanel() {
  const { sidePanel, togglePanel } = useStudioStore("sidePanel", "togglePanel");

  const isLgScreen = useIsLgScreen();

  return (
    <aside>
      <Root
        open={!isLgScreen && sidePanel === "open"}
        onOpenChange={() => togglePanel("sidePanel")}
      >
        <DialogPortal>
          <DialogOverlay className="fixed top-0 left-0 w-full h-full bg-black/40" />
          <DialogContent
            className={cn(
              "fixed left-0 top-0 z-50 grid w-[375px]",
              "gap-4 border bg-background shadow-lg duration-75",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-left-1/2",
              "data-[state=open]:slide-in-from-left-1/2",
              "sm:rounded-lg",
              "h-full",
              "z-50",
            )}
          >
            <NavigationFrame>
              <div className="flex items-center justify-between pb-4">
                <DialogTitle>Navigation</DialogTitle>
                <DialogDescription className="sr-only">
                  Create a new request or select a request from history
                </DialogDescription>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="p-0.5 w-6 h-6">
                    <Icon icon="lucide:panel-left-close" />
                  </Button>
                </DialogClose>
              </div>
              <NavigationPanel />
            </NavigationFrame>
          </DialogContent>
        </DialogPortal>
      </Root>
    </aside>
  );
}
