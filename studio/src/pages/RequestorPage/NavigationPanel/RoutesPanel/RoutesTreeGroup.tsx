import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import {
  type ReactNode,
  createContext,
  memo,
  useContext,
  useState,
} from "react";

type RoutesTreeGroupProps = { children: ReactNode; filePath: string };

const LevelContext = createContext(0);

export const RoutesTreeGroup = memo(function RoutesTreeGroup({
  children,
  filePath,
}: RoutesTreeGroupProps) {
  const level = useContext(LevelContext);
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((current) => !current);

  return (
    <LevelContext.Provider value={level + 1}>
      <button
        type="button"
        className="flex gap-2 px-2 rounded items-center text-muted-foreground border-l hover:bg-muted"
        onClick={toggleCollapsed}
      >
        <span className="font-medium font-mono text-xs leading-8">
          {filePath}
        </span>
        <span className="ml-auto">
          {!collapsed ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
      </button>
      {!collapsed && <div className="pl-4 border-l">{children}</div>}
    </LevelContext.Provider>
  );
});
