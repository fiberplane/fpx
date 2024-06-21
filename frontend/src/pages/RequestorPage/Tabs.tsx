import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { ComponentProps } from "react";
import { cn } from "@/utils";
import { TabsTrigger, TabsList } from "@/components/ui/tabs";

const TAB_HEIGHT = "h-12"

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
  ))

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
        "text-sm",
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
