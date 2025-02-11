import { cn } from "@/utils";

export const RequestPath = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <span className={cn("text-sm font-mono", className)}>{children}</span>;
};
