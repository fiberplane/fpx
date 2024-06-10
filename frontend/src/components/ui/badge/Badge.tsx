import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/utils";
import { badgeVariants } from "./variants";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
