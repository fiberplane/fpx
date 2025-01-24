import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import type { ComponentProps } from "react";
import { Spinner } from "./Spinner";
import { useChangedSticky } from "./useChangedSticky";

export function BusyInput(originalProps: ComponentProps<typeof Input>) {
  const { className = "", ...props } = originalProps;

  const value = props.value || "";
  const isChanged = useChangedSticky(value);

  return (
    <div className="relative bg-background rounded-md gap-2">
      <Input {...props} className={cn("border-transparent pe-8", className)} />
      <div className="absolute h-full flex items-center right-1 top-0">
        <Spinner spinning={isChanged} className="text-muted-foreground" />
      </div>
    </div>
  );
}
