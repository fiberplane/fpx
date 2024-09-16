import { open } from "@tauri-apps/api/dialog";
import { appDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { cn } from "./utils";
import { listen } from "@tauri-apps/api/event";

type RecentProjects = Array<string>;

type Idable<T> = {
  id: string;
  inner: T;
};

type EventMessage = {
  type: string;
  details: EventMessageDetails;
};

type EventMessageDetails = {
  newSpans: Array<[string, string]>;
};

type Project = {
  listen_port: number;
};

export function App() {
  const [error, setError] = useState<string | undefined>();
  const [recentProjects, setRecentProjects] = useState<RecentProjects>([]);

  const [eventMessage, setEventMessage] = useState<Array<Idable<EventMessage>>>(
    [],
  );

  useEffect(() => {
    listen<EventMessage>("api_message", (message) => {
      const id_message2: Idable<EventMessage> = {
        id: Math.random().toString(36).substring(7),
        inner: message.payload,
      };
      setEventMessage((event_messages) => [...event_messages, id_message2]);
    });
  }, []);

  const handleStart = useCallback(() => {
    (async () => {
      try {
        await invoke("start_server");
      } catch (e) {
        // TODO: Handle type share
        setError(e as string);
      }
    })();
  }, []);

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
        <Button onClick={() => handleStart()}>Start server</Button>
      </Card>
      <Card className="p-4 flex flex-col gap-8 w-full h-full">
        {eventMessage.map((event_message) => (
          <p key={event_message.id}>
            {event_message.inner.type}:{" "}
            {event_message.inner.details.newSpans.map(
              ([trace_id, span_id]) => trace_id + " -  " + span_id,
            )}
          </p>
        ))}
      </Card>
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
