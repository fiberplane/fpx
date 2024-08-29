import { CountBadge } from "@/components/CountBadge";
import { type ReactNode, useMemo } from "react";
import { CollapsibleSubSection } from "../../shared";
import { KeyValueTable } from "./KeyValueTable";

type Props = {
  keyValue:
    | Record<string, string>
    | Array<[string | ReactNode, string | ReactNode]>;
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
  title: string;
  /**
   * You can pass a className to the heading to style it
   * (this is where the title and count will appear in)
   */
  headingClassName?: string;
  sensitiveKeys?: string[] | ((key: string) => boolean);
  keyCellClassName?: string;
};

export function CollapsibleKeyValueTableV2({
  keyValue,
  emptyMessage = "No data",
  className,
  defaultCollapsed = true,
  title,
  sensitiveKeys = [],
  keyCellClassName,
  headingClassName,
}: Props) {
  // const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const count = Object.entries(keyValue).length;
  const heading = useMemo(() => {
    return (
      <>
        {title}
        <CountBadge count={count} />
      </>
    );
  }, [count, title]);
  // const toggleIsOpen = () => setIsOpen((o) => !o);
  return (
    <CollapsibleSubSection
      className={className}
      heading={heading}
      headingClassName={headingClassName}
      defaultCollapsed={defaultCollapsed}
    >
      <KeyValueTable
        keyValue={keyValue}
        emptyMessage={emptyMessage}
        className="pl-6 mt-1"
        sensitiveKeys={sensitiveKeys}
        keyCellClassName={keyCellClassName}
      />
    </CollapsibleSubSection>
  );
}
