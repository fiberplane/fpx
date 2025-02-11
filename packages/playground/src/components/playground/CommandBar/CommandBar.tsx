import { useTheme } from "@/components/theme-provider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsOpen } from "@/hooks";
import { useWorkflowStore } from "@/lib/workflowStore";
import { Icon } from "@iconify/react";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import { useStudioStore } from "../store";
import { CustomCommandItem } from "./CustomCommandItem";

type CommandBarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CommandBar({ open, setOpen }: CommandBarProps) {
  const {
    visibleRequestsPanelTabs,
    setActiveRequestsPanelTab,
    setShortcutsOpen,
  } = useStudioStore(
    "visibleRequestsPanelTabs",
    "setActiveRequestsPanelTab",
    "setShortcutsOpen",
  );
  const { setWorkflowCommandOpen } = useWorkflowStore();

  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = React.useState("");
  const { setSettingsOpen } = useSettingsOpen();
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
            className="border-none h-11 focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Playground" className="py-2">
              <CustomCommandItem
                onSelect={() => {
                  navigate({ to: "/" });
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:play" className="w-4 h-4" />
                <span>Open Playground</span>
              </CustomCommandItem>
              {visibleRequestsPanelTabs.map((tabName) => {
                return (
                  <CustomCommandItem
                    key={tabName}
                    onSelect={() => {
                      setActiveRequestsPanelTab(tabName);
                      setOpen(false);
                    }}
                    value={`request ${tabName}`}
                  >
                    <Icon icon="lucide:file-text" className="w-4 h-4" />
                    <span>
                      Open Request <span className="capitalize">{tabName}</span>
                    </span>
                  </CustomCommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Workflows" className="py-2">
              <CustomCommandItem
                onSelect={() => {
                  navigate({ to: "/workflows" });
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:workflow" className="w-4 h-4" />
                <span>Open Workflows</span>
              </CustomCommandItem>
              <CustomCommandItem
                onSelect={() => {
                  setWorkflowCommandOpen(true);
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:workflow" className="w-4 h-4" />
                <span>Create Workflow</span>
              </CustomCommandItem>
            </CommandGroup>
            <CommandSeparator className="mx-2" />
            <CommandGroup heading="Settings" className="py-2">
              <CustomCommandItem
                onSelect={() => {
                  setSettingsOpen(true);
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:settings" className="w-4 h-4 mr-2" />
                <span>Open Settings</span>
              </CustomCommandItem>
              <CustomCommandItem
                onSelect={() => {
                  setShortcutsOpen(true);
                  setOpen(false);
                }}
                // HACK - I excluded the phrase "shortcuts" from the value here because it made the term "docs" match this menu item and i didn't like that
                value="show keyboard hotkeys"
              >
                <Icon icon="lucide:book-open" className="w-4 h-4 mr-2" />
                <span>Show Keyboard Shortcuts</span>
              </CustomCommandItem>
            </CommandGroup>
            <CommandSeparator className="mx-2" />
            <CommandGroup heading="Theme" className="py-2">
              <CustomCommandItem
                onSelect={() => {
                  setTheme("light");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:sun" className="w-4 h-4 mr-2" />
                <span>Light Theme</span>
              </CustomCommandItem>
              <CustomCommandItem
                onSelect={() => {
                  setTheme("dark");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:moon" className="w-4 h-4 mr-2" />
                <span>Dark Theme</span>
              </CustomCommandItem>
              <CustomCommandItem
                onSelect={() => {
                  setTheme("system");
                  setOpen(false);
                }}
              >
                <Icon icon="lucide:monitor" className="w-4 h-4 mr-2" />
                <span>System Theme</span>
              </CustomCommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
