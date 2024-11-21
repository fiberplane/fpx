import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  LayoutIcon, 
  FileTextIcon, 
  ChatBubbleIcon, 
  ClockIcon 
} from "@radix-ui/react-icons";

interface CommandBarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandBar({ open, setOpen }: CommandBarProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[500px] mx-auto">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput 
            placeholder="Type a command or search..." 
            className="h-11 border-none focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation" className="py-2">
              <CommandItem className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer">
                <LayoutIcon className="flex-shrink-0" />
                <span>Toggle Timeline Panel</span>
              </CommandItem>
              <CommandItem className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer">
                <FileTextIcon className="flex-shrink-0" />
                <span>Toggle Logs Panel</span>
              </CommandItem>
              <CommandItem className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer">
                <ChatBubbleIcon className="flex-shrink-0" />
                <span>Toggle AI Panel</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="mx-2" />
            <CommandGroup heading="History" className="py-2">
              <CommandItem className="flex items-center gap-2 px-2 hover:bg-accent rounded-sm cursor-pointer">
                <ClockIcon className="flex-shrink-0" />
                <span>Recent Requests</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 