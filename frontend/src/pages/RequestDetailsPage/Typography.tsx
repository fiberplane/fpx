import { cn } from "@/utils";

export const SectionHeading = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
};
