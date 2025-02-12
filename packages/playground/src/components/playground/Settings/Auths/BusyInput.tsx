import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { type ComponentProps, forwardRef } from "react";
import { Spinner } from "./Spinner";
import { useChangedSticky } from "./useChangedSticky";

export const BusyInput = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof Input>
>((originalProps, ref) => {
  const { className = "", ...props } = originalProps;

  const value = props.value || "";
  const isChanged = useChangedSticky(value);

  return (
    <div className="relative bg-background rounded-md gap-2">
      <Input
        {...props}
        ref={ref}
        className={cn("border-transparent pe-8", className)}
      />
      <div className="absolute h-full flex items-center right-1 top-0">
        <Spinner spinning={isChanged} className="text-muted-foreground" />
      </div>
    </div>
  );
});
