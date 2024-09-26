import type { MizuOrphanLog } from "@/queries";
import { objectWithKey } from "@/utils";
import type { OtelEvent } from "@fiberplane/fpx-types";

export type NeonEvent = {
  id: string;
  type: "neon-event";
  timestamp: Date;
  sql: {
    query: string;
    params: Array<string>;
  };
  duration: number;
  rowCount: number | null;
  errors?: OtelEvent[];
};

export const isNeonEvent = (log: unknown): log is NeonEvent => {
  return objectWithKey(log, "type") && log.type === "neon-event";
};

export type LogEntry = MizuOrphanLog | NeonEvent;
