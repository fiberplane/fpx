import {
  MizuOrphanLog,
  MizuSpan,
  MizuTraceV2,
  isMizuOrphanLog,
} from "@/queries";
import { isMizuSpan } from "@/queries/traces-v2";

export type NormalizedSpan = MizuSpan & {
  normalizedStartTime: number;
  normalizedEndTime: number;
  normalizedDuration: number;
};

export type NormalizedOrphanLog = MizuOrphanLog & {
  normalizedTimestamp: number;
};

type NormalizedMizuWaterfall = Array<NormalizedSpan | NormalizedOrphanLog>;

/**
 * Modifies a trace waterfall (Logs and Spans) to have normalized timestamps
 * between 0 and 1.
 *
 * This allows us to visualize the timeline of the trace on a normalized scale.
 */
export const normalizeWaterfallTimestamps = (
  waterfall: MizuTraceV2["waterfall"],
): NormalizedMizuWaterfall => {
  const minStart = Math.min(
    ...waterfall.map((span) =>
      isMizuSpan(span)
        ? new Date(span.start_time).getTime()
        : new Date(span.timestamp).getTime(),
    ),
  );
  const maxEnd = Math.max(
    ...waterfall.map((span) =>
      isMizuSpan(span)
        ? new Date(span.end_time).getTime()
        : new Date(span.timestamp).getTime(),
    ),
  );

  const normalizeSpan = (span: MizuSpan): NormalizedSpan => {
    const startTime = new Date(span.start_time).getTime();
    const endTime = new Date(span.end_time).getTime();
    return {
      ...span,
      normalizedStartTime: (startTime - minStart) / (maxEnd - minStart),
      normalizedEndTime: (endTime - minStart) / (maxEnd - minStart),
      normalizedDuration: (endTime - startTime) / (maxEnd - minStart),
    };
  };

  const normalizeLog = (log: MizuOrphanLog): NormalizedOrphanLog => {
    const timestamp = new Date(log.timestamp).getTime();
    return {
      ...log,
      normalizedTimestamp: (timestamp - minStart) / (maxEnd - minStart),
    };
  };

  return waterfall.map((spanOrLog) => {
    if (isMizuOrphanLog(spanOrLog)) {
      return normalizeLog(spanOrLog);
    }
    return normalizeSpan(spanOrLog);
  });
};
