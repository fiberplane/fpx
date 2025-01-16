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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import React from "react";
import { useStudioStore } from "../store";

type CommandBarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CommandBar({ open, setOpen }: CommandBarProps) {
  const {
    // togglePanel,
    visibleRequestsPanelTabs,
    setActiveRequestsPanelTab,
    setSettingsOpen,
    useMockApiSpec,
    setUseMockApiSpec,
  } = useStudioStore(
    "togglePanel",
    "visibleRequestsPanelTabs",
    "setActiveRequestsPanelTab",
    "setSettingsOpen",
    "useMockApiSpec",
    "setUseMockApiSpec",
  );

  const [inputValue, setInputValue] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[500px] mx-auto data-[state=open]:bg-transparent">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Type a command or search in the menu...
        </DialogDescription>
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          value={inputValue}
          onValueChange={setInputValue}
        >
          <CommandInput
            placeholder="Type a command or search..."
            className="h-11 border-none focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandSeparator className="mx-2" />
            <CommandGroup heading="Settings" className="py-2">
              <CommandItem
                onSelect={() => {
                  setSettingsOpen(true);
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:settings" className="h-4 w-4 mr-2" />
                <span>Open Settings</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setUseMockApiSpec(!useMockApiSpec);
                  setOpen(false);
                }}
              >
                <Icon
                  icon="lucide:toggle-left"
                  className={`h-4 w-4 mr-2 ${useMockApiSpec ? "rotate-180" : ""}`}
                />
                <span>
                  {useMockApiSpec ? "Disable" : "Enable"} Mock API Spec
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="mx-2" />
            <CommandGroup heading="Request" className="py-2">
              {visibleRequestsPanelTabs.map((tabName) => {
                return (
                  <CommandItem
                    key={tabName}
                    className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                    onSelect={() => {
                      setActiveRequestsPanelTab(tabName);
                      setOpen(false);
                    }}
                  >
                    <Icon icon="lucide:file-text" className="h-4 w-4" />
                    <span>
                      Open Request <span className="capitalize">{tabName}</span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
