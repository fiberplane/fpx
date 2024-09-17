import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils";
import { useContext, useEffect, useState } from "react";
import { RuntimeContext } from "../RuntimeProvider";
import { listRecentWorkspaces } from "../utils";

export function WorkspaceSelector() {
  const runtime = useContext(RuntimeContext);
  const [paths, setPaths] = useState<Array<string>>([]);

  useEffect(() => {
    listRecentWorkspaces().then(setPaths);
  }, []);

  if (runtime?.type !== "tauri") {
    return null;
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <Card className="p-4 flex flex-col gap-8 w-full h-full">
        <strong>Recent projects</strong>
        <div className="flex flex-col gap-4">
          {paths.map((path) => (
            <button
              key={path}
              className={cn(
                "flex items-center p-4",
                "border-l-2 border-transparent",
                "hover:bg-primary/10 hover:border-blue-500",
                "transition-all",
                "cursor-pointer",
              )}
              onClick={() => runtime.requestOpenWorkspaceByPath(path)}
              type="button"
            >
              {path}
            </button>
          ))}
        </div>
        <Button onClick={runtime.requestOpenWorkspaceDialog}>
          Open workspace...
        </Button>
      </Card>
    </div>
  );
}
