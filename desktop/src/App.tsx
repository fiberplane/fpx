import { open } from "@tauri-apps/api/dialog";
import { appDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback } from "react";

type Project = {
  listen_port: number;
};

export function App() {
  const handleOpen = useCallback(() => {
    (async () => {
      const selected = await open({
        directory: true,
        defaultPath: await appDir(),
        multiple: false,
      });

      if (selected) {
        const project = await invoke<Project>("open_project", {
          path: selected,
        });
        console.log(project);
      }
    })();
  }, []);

  return (
    <button onClick={handleOpen} type="button">
      Open
    </button>
  );
}

export default App;
