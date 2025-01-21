import { cn } from "@/utils";

export const SubSectionHeading = ({
  children,
  onClick,
  className,
}: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  return (
    <div
      className={cn("font-semibold text-xs py-1", className)}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
};
