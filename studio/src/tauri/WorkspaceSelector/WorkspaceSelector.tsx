import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { RuntimeContext } from "../RuntimeProvider";

export function WorkspaceSelector() {
  const runtime = useContext(RuntimeContext);

  if (runtime?.type !== "tauri") {
    return null;
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <Button onClick={runtime.requestOpenWorkspaceDialog}>Open</Button>
    </div>
  );
}
