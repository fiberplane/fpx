import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import * as React from "react";

const CustomCommandItem = React.forwardRef<
  React.ElementRef<typeof CommandItem>,
  React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, ...props }, ref) => (
  <CommandItem
    ref={ref}
    className={cn(
      "data-[selected=true]:bg-secondary data-[selected=true]:text-secondary-foreground",
      className,
    )}
    {...props}
  />
));

CustomCommandItem.displayName = "CustomCommandItem";

export { CustomCommandItem };
