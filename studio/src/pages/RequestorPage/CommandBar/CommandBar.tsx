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
import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";
import { useRequestorStore } from "../store";

interface CommandBarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onGenerateRequest?: (prompt?: string) => void;
}

export function CommandBar({
  open,
  setOpen,
  // onGenerateRequest,
}: CommandBarProps) {
  const { togglePanel, visibleRequestsPanelTabs, setActiveRequestsPanelTab } =
    useRequestorStore(
      "togglePanel",
      "visibleRequestsPanelTabs",
      "setActiveRequestsPanelTab",
    );

  const [inputValue, setInputValue] = React.useState("");

  // const handleGenerateRequest = (currentInput: string) => {
  //   // Extract any text after "generate" as the prompt
  //   const prompt = currentInput.replace(/^generate\s*/, "").trim();
  //   onGenerateRequest?.(prompt.length > 0 ? prompt : undefined);
  //   setOpen(false);
  //   setInputValue("");
  // };

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
            {/* <CommandGroup heading="Actions" className="py-2">
              <CommandItem
                className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                onSelect={() => handleGenerateRequest(inputValue)}
              >
                <MagicWandIcon className="flex-shrink-0" />
                <span>Generate Request Data</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Type additional text for custom prompt
                </span>
              </CommandItem>
            </CommandGroup> */}
            {/* <CommandSeparator className="mx-2" /> */}
            <CommandGroup heading="Navigation" className="py-2">
              <CommandItem
                className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                onSelect={() => {
                  togglePanel("timelinePanel");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:align-start-vertical" className="h-4 w-4" />
                <span>Toggle Timeline Panel</span>
              </CommandItem>
              <CommandItem
                className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                onSelect={() => {
                  togglePanel("logsPanel");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:file-text" className="h-4 w-4" />
                <span>Toggle Logs Panel</span>
              </CommandItem>
              <CommandItem
                className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                onSelect={() => {
                  togglePanel("aiPanel");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:sparkles" className="h-4 w-4" />
                <span>Toggle AI Panel</span>
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
            {/* <CommandSeparator className="mx-2" />
            <CommandGroup heading="History" className="py-2">
              <CommandItem className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer">
                <ClockIcon className="flex-shrink-0" />
                <span>Recent Requests</span>
              </CommandItem>
            </CommandGroup> */}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
