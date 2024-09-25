import { cn } from "@/utils";

export const SectionHeading = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <h3 className={cn("text-xs font-mono", className)}>{children}</h3>;
};

export const SubSection = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
};

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
