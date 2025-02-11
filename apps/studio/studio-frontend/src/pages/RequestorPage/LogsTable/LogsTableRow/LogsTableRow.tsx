import { type LogEntry, isNeonEvent } from "../types";
import { LogRow } from "./LogRow";
import { NeonEventRow } from "./NeonEventRow";

type LogRowProps = {
  log: LogEntry;
};

export function LogsTableRow({ log }: LogRowProps) {
  if (isNeonEvent(log)) {
    return <NeonEventRow log={log} />;
  }
  return <LogRow log={log} />;
}
