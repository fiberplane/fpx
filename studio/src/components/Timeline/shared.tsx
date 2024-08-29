import { Card } from "@/components/ui/card";
import { cn, getHttpMethodTextColor } from "@/utils";
import { Collapsible } from "@radix-ui/react-collapsible";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { type ComponentProps, type ReactNode, useState } from "react";
import { CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

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

export const Divider = () => {
  return <div className="h-[1px] w-full bg-muted/80" />;
};

export const CollapsibleSubSection = ({
  heading,
  children,
}: { heading: ReactNode; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleIsOpen = () => setIsOpen((o) => !o);
  return (
    <SubSection>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading
            className="flex items-center gap-2 cursor-pointer"
            onClick={toggleIsOpen}
          >
            {isOpen ? (
              <CaretDownIcon className="w-4 h-4 cursor-pointer" />
            ) : (
              <CaretRightIcon className="w-4 h-4 cursor-pointer" />
            )}
            {heading}
          </SubSectionHeading>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Collapsible>
    </SubSection>
  );
};
