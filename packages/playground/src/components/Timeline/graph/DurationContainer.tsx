import { cn } from "@/utils";
import type { ReactNode } from "react";

export function DurationContainer(props: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div>
      <div className="w-full h-6 flex items-center justify-center">
        <div className={cn("h-4 bg-primary/10 rounded grow", props.className)}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
