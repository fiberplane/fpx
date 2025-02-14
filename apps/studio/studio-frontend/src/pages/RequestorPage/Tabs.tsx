import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import type * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import type { ComponentProps } from "react";

const TAB_HEIGHT = "h-8";

export const CustomTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "w-full justify-start rounded-none border-b space-x-6",
      TAB_HEIGHT,
      className,
    )}
    {...props}
  />
));

export function CustomTabTrigger(props: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      {...props}
      className={cn(
        "py-2",
        "px-0",
        "text-left",
        TAB_HEIGHT,
        "ml-2",
        "text-xs",
        "font-normal",
        "border-b",
        "border-transparent",
        "data-[state=active]:font-medium",
        "data-[state=active]:text-gray-100",
        "data-[state=active]:shadow-none",
        "data-[state=active]:bg-inherit",
        "data-[state=active]:rounded-none",
        "data-[state=active]:border-blue-500",
        props.className,
      )}
    />
  );
}

export const CustomTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  React.ComponentPropsWithoutRef<typeof TabsContent>
>(({ className, ...props }, ref) => (
  <TabsContent
    ref={ref}
    {...props}
    // the default tabIndex of 0 causes the tab to be focused which, considering how
    // we use this component is not desirable
    tabIndex={-1}
    className={cn(
      "px-3 py-2 data-[state=active]:h-full data-[state=inactive]:hidden",
      "overflow-y-auto max-h-full",
      className,
    )}
  />
));
