import { cn } from "@/utils";
import { type HTMLAttributes, forwardRef } from "react";

export const ScrollArea = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto",
        // Hide scrollbar in Firefox
        "scrollbar-none",
        // Hide scrollbar in Chrome/Safari
        "[&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = "ScrollArea";
