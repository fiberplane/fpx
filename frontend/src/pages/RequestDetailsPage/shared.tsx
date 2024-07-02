import { Card } from "@/components/ui/card";
import { cn } from "@/utils";
import { ComponentProps } from "react";
import { getHttpMethodTextColor } from "../RequestorPage/method";

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
    <span className={cn("text-sm", getHttpMethodTextColor(method), className)}>
      {method}
    </span>
  );
}
