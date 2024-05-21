import { useEffect, useState } from "react";
import { MizuLog, transformToLog } from "./decoders";

export function useMizulogs() {
  const [logs, setLogs] = useState([] as Array<MizuLog>)
  useEffect(() => {
    fetch("http://localhost:8788/v0/logs", { mode: "cors" }).then(r => r.json())
      .then(j => {
        setLogs(j.logs.map(transformToLog))
      }).catch((e: unknown) => {
        console.error("Error fetching logs: ", e);
        if (e instanceof Error) {
          alert(`Error fetching logs: ${e.message}`);
        }
      })
  }, [])

  return logs;
}
