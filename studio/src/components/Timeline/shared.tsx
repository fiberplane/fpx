import { Card } from "@/components/ui/card";
import { cn, getHttpMethodTextColor } from "@/utils";
import type { ComponentProps } from "react";

export const FpxCard = ({
  children,
  className,
  ...props
}: ComponentProps<typeof Card>) => {
  return (
    <Card className={cn("rounded-lg", className)} {...props}>
      {children}
    </Card>
  );
};

export const SectionHeading = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
};

export const RequestPath = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => {
  return <span className={cn("text-sm font-mono", className)}>{children}</span>;
};

export function RequestMethod({
  method,
  className,
}: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-sm uppercase",
        getHttpMethodTextColor(method),
        className,
      )}
    >
      {method}
    </span>
  );
}

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
