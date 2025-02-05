import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

const TAB_HEIGHT = "h-8";

const FpTabs = TabsPrimitive.Root;

const FpTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      "w-full justify-start rounded-none border-b space-x-6",
      TAB_HEIGHT,
      className,
    )}
    {...props}
  />
));
FpTabsList.displayName = TabsPrimitive.List.displayName;

const FpTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md px-3 py-1",
      "whitespace-nowrap text-sm font-medium",
      "ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "enabled:hover:text-foreground",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      "py-2",
      "px-0",
      "text-left",
      TAB_HEIGHT,
      "ml-2",
      "text-xs",
      "font-normal",
      "border-b",
      "border-transparent",
      "data-[state=active]:text-foreground",
      "data-[state=active]:shadow-none",
      "data-[state=active]:bg-inherit",
      "data-[state=active]:rounded-none",
      "data-[state=active]:border-primary",
      className,
    )}
    {...props}
  />
));
FpTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const FpTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "px-3 py-2 data-[state=active]:h-full data-[state=inactive]:hidden",
      "overflow-y-auto max-h-full",
      className,
    )}
    {...props}
  />
));
FpTabsContent.displayName = TabsPrimitive.Content.displayName;

export { FpTabs, FpTabsList, FpTabsTrigger, FpTabsContent };
