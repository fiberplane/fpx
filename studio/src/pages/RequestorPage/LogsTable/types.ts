import type { MizuOrphanLog } from "@/queries";

export type NeonEvent = {
  id: string;
  type: "neon-event";
  timestamp: Date;
  sql: {
    query: string;
    params: Array<string>
  }
};

// FIXME
export const isNeonEvent = (log: unknown): log is NeonEvent => {
  return (
    typeof log === "object" &&
    log !== null &&
    "type" in log &&
    log.type === "neon-event"
  );
};

export type LogEntry = MizuOrphanLog | NeonEvent;
