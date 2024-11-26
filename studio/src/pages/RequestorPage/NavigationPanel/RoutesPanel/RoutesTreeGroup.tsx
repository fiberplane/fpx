import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
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
      <div className="border-l border-l-input">
        <button
          type="button"
          className="ml-2 mb-2 flex gap-2 px-2 rounded items-center text-muted-foreground hover:bg-muted"
          onClick={toggleCollapsed}
        >
          <span className="font-medium font-mono text-xs leading-8">
            {filePath}
          </span>
          <span className="ml-auto">
            {!collapsed ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        </button>
        {!collapsed && <div className="pl-4">{children}</div>}
      </div>
    </LevelContext.Provider>
  );
});
