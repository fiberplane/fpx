import { cn } from "@/utils";

export const SubSection = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col gap-2">{children}</div>;
};

export const SubSectionHeading = ({
  children,
  onClick,
  className,
}: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  return (
    <div
      className={cn("font-semibold text-sm py-1", className)}
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

export const Divider = () => {
  return <div className="h-[1px] w-full bg-muted/80" />;
};
