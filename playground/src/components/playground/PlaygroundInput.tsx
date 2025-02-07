import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isMac } from "@/utils";
import { Icon } from "@iconify/react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Method } from "../Method";
import {
  FpDropdownMenu,
  FpDropdownMenuContent,
  FpDropdownMenuPortal,
  FpDropdownMenuRadioGroup,
  FpDropdownMenuTrigger,
  FpMinimalDropdownMenuRadioItem,
} from "../ui/dropdown-menu";
import { useStudioStore } from "./store";
import { useUrlPreview } from "./store/hooks/useUrlPreview";
import { getRouteId } from "./store/slices/requestResponseSlice";

type PlaygroundInputProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPlaygroundRequesting?: boolean;
  formRef: React.RefObject<HTMLFormElement>;
};

export function PlaygroundInput({
  onSubmit,
  isPlaygroundRequesting,
  formRef,
}: PlaygroundInputProps) {
  const { activeRoute, setActiveRoute, appRoutes } = useStudioStore(
    "activeRoute",
    "setActiveRoute",
    "appRoutes",
  );

  const path = useUrlPreview() ?? "";
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      // NOTE - For some reason, in prod (not locally), we get a `margin-block-end: 1rem` on the form element from the user-agent-stylesheet
      //        That's why we add `m-0` to the form element.
      className="flex items-center justify-between bg-input border rounded-lg mx-0 py-2"
    >
      <FpDropdownMenu>
        <FpDropdownMenuTrigger className="flex flex-grow items-center ml-2 gap-2 h-min hover:bg-muted data-[state=open]:bg-muted rounded-sm">
          <Method
            method={activeRoute?.method || "GET"}
            className="ml-2 text-sm"
          />
          <div className="flex w-full my-2 text-xs font-mono border-none shadow-none focus:ring-0 ml-0 py-0">
            {path}
          </div>
          <CaretSortIcon className="w-3 h-3 mr-1" />
        </FpDropdownMenuTrigger>
        <FpDropdownMenuPortal>
          <FpDropdownMenuContent align="start">
            <FpDropdownMenuRadioGroup
              value={activeRoute ? getRouteId(activeRoute) : ""}
            >
              {appRoutes.map((route) => (
                <FpMinimalDropdownMenuRadioItem
                  key={getRouteId(route)}
                  onSelect={() => setActiveRoute(route)}
                  value={getRouteId(route)}
                  className="aria-checked:bg-muted aria-checked:focus:text-accent-foreground focus:bg-muted "
                >
                  <div
                    className={cn(
                      "flex-grow grid grid-cols-[2.5rem_auto] items-center gap-2 px-2 rounded-md",
                    )}
                  >
                    <Method method={route.method} className="ml-2 text-sm" />
                    <div className="flex w-full my-2">
                      <div className="flex-initial text-xs w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0 disabled:cursor-text disabled:bg-muted py-0">
                        {route.description || route.title || route.path}
                      </div>
                    </div>
                  </div>
                </FpMinimalDropdownMenuRadioItem>
              ))}
            </FpDropdownMenuRadioGroup>
          </FpDropdownMenuContent>
        </FpDropdownMenuPortal>
      </FpDropdownMenu>
      <div className="flex items-center space-x-2 px-2 py-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              type="submit"
              disabled={isPlaygroundRequesting}
              variant="default"
              className={cn("p-2 md:px-2.5 py-1 h-auto")}
            >
              <span className="hidden md:inline">Send</span>
              <Icon
                icon="lucide:send-horizontal"
                className="w-4 h-4 md:hidden"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="bg-secondary px-2 py-1.5 flex gap-1.5"
            align="center"
            side="left"
            sideOffset={16}
          >
            <div className="flex gap-0.5">
              <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
              <KeyboardShortcutKey>Enter</KeyboardShortcutKey>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}
