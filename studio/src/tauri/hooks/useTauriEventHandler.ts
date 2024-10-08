import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";

export function useTauriEventHandler(event: string, callback: () => void) {
  useEffect(() => {
    const handler = listen<string>(event, callback);

    return () => {
      handler.then((unlisten) => unlisten());
    };
  }, [callback, event]);
}
