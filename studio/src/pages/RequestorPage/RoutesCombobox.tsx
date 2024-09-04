import { CaretSortIcon, CheckIcon, PlusIcon } from "@radix-ui/react-icons";
import * as React from "react";

import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/utils";
import { useHotkeys } from "react-hotkeys-hook";
import { RouteItem } from "./NavigationPanel";
import { AddRoutesDialog } from "./routes/AddRouteButton";
import { useRequestorStore } from "./store";

export const RoutesCombobox = React.memo(function RoutesCombobox() {
  const {
    routes,
    selectedRoute,
    selectRoute: handleRouteClick,
  } = useRequestorStore("routes", "selectedRoute", "selectRoute");
  const [openRoutesDialog, setOpenRoutesDialog] = React.useState(false);
  const isLg = useIsLgScreen();
  useHotkeys("c", (e) => {
    if (!isLg) {
      e.preventDefault();
      setOpenRoutesDialog(true);
    }
  });

  const [openApi, setOpenApi] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | undefined>(
    selectedRoute ? `${selectedRoute.method}-${selectedRoute.path}` : undefined,
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 bg-transparent"
          >
            Select a Route
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-96 shadow-md" align="start">
          <Command className="bg-[rgb(12,18,32)]">
            <CommandInput placeholder="Search routes..." className="h-12" />
            <CommandList>
              <CommandItem
                className="flex items-center justify-between cursor-pointer"
                onSelect={() => {
                  setOpenRoutesDialog(true);
                  setOpen(false);
                }}
              >
                <div className="flex items-center">
                  <PlusIcon className="h-3 w-3 mr-2 " />
                  Add New
                </div>
                <KeyboardShortcutKey>C</KeyboardShortcutKey>
              </CommandItem>
              <CommandSeparator />
              <CommandEmpty>No route found.</CommandEmpty>
              <CommandGroup>
                {routes?.map((route) => {
                  const identifier = `${route.method}-${route.path}-${route.routeOrigin}`;
                  return (
                    <CommandItem
                      className="text-base"
                      key={identifier}
                      value={identifier}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        handleRouteClick(route);
                        setOpen(false);
                      }}
                    >
                      <RouteItem route={route} />
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === identifier ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddRoutesDialog
        open={!isLg && openRoutesDialog}
        setOpen={setOpenRoutesDialog}
        openApi={openApi}
        setOpenApi={setOpenApi}
      />
    </>
  );
});
