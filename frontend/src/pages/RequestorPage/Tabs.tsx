import { cn } from "@/utils";
import { TabsTrigger } from "@radix-ui/react-tabs";
import { ComponentProps } from "react";

export function CustomTabTrigger(props: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      {...props}
      className={cn(
        "py-1",
        "px-0",
        "text-left",
        "h-9",
        "ml-2",
        "text-sm",
        "font-normal",
        "border-b",
        "border-transparent",
        "data-[state=active]:font-medium",
        "data-[state=active]:text-gray-700",
        "data-[state=active]:shadow-none",
        "data-[state=active]:bg-inherit",
        "data-[state=active]:rounded-none",
        "data-[state=active]:border-blue-500",
        props.className,
      )}
    />
  );
}
