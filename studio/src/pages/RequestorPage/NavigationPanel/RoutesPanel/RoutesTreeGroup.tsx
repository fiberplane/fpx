import { cn } from "@/utils";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { type ReactNode, memo } from "react";
import { useStudioStore } from "../../store";

type RoutesTreeGroupProps = {
  children: ReactNode;
  filePath: string;
  level?: number;
  collapsed?: boolean;
};

export const RoutesTreeGroup = memo(function RoutesTreeGroup({
  children,
  filePath,
  level = 0,
  collapsed = false,
}: RoutesTreeGroupProps) {
  const { toggleTreeNode: toggleCollapsed } = useStudioStore("toggleTreeNode");
  return (
    <div className={cn("pt-2 grid min-w-0", { "pt-0": level === 0 })}>
      <button
        type="button"
        className={cn(
          "grid px-1 grid-cols-[24px_auto] items-center",
          "px-1",
          "rounded text-left",
          "text-muted-foreground hover:bg-muted",
        )}
        onClick={() => toggleCollapsed(filePath)}
      >
        <span className="">
          {!collapsed ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <div className="font-medium font-mono text-xs leading-6">
          {filePath}
        </div>
      </button>
      {!collapsed && (
        <div
          className={cn({
            "ml-[10px] ": level > 0,
            "pl-[10px]": true,
            "border-l border-l-input": level > 0,
          })}
        >
          {children}
        </div>
      )}
    </div>
  );
});
