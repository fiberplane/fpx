import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";
import { SubSectionHeading } from "./SubSectionHeading";

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

type Props = {
  heading: ReactNode;
  headingClassName?: string;
  /*
   * If true, the section will be collapsed by default
   * if left undefined, the section will be open by default
   */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
};

export const CollapsibleSubSection = ({
  heading,
  children,
  headingClassName,
  defaultCollapsed = false,
  className,
}: Props) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const toggleIsOpen = () => setIsOpen((o) => !o);
  return (
    <SubSection className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              headingClassName,
            )}
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
