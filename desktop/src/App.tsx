import { open } from "@tauri-apps/api/dialog";
import { appDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { cn } from "./utils";

type RecentProjects = Array<string>;

type Project = {
  listen_port: number;
};

export function App() {
  const [error, setError] = useState<string | undefined>();
  const [recentProjects, setRecentProjects] = useState<RecentProjects>([]);

  const handleOpen = useCallback((path?: string) => {
    (async () => {
      const selected =
        path ||
        (await open({
          directory: true,
          defaultPath: await appDir(),
          multiple: false,
        }));

      if (selected) {
        try {
          await invoke<Project>("open_project", {
            path: selected,
          });
        } catch (e) {
          // TODO: Handle type share
          setError(e as string);
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const projects = await invoke<RecentProjects>("list_recent_projects");
      setRecentProjects(projects);
    })();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen p-4">
      {error && <div className="bg-orange-800 rounded p-4">{error}</div>}
      <Card className="p-4 flex flex-col gap-8 w-full h-full">
        <strong>Recent projects</strong>
        <div className="flex flex-col gap-4">
          {recentProjects.map((path) => (
            <button
              key={path}
              className={cn(
                "flex items-center p-4",
                "border-l-2 border-transparent",
                "hover:bg-primary/10 hover:border-blue-500",
                "transition-all",
                "cursor-pointer",
              )}
              onClick={() => handleOpen(path)}
              type="button"
            >
              {path}
            </button>
          ))}
        </div>
        <Button className="mt-auto" onClick={() => handleOpen()} type="button">
          Open project...
        </Button>
      </Card>
    </div>
  );
}

export default App;
