import { useMemo } from "react";
import { z } from "zod";

import { useMizuTraces } from "./queries";
import {
  MizuErrorMessageSchema,
  MizuFetchEndSchema,
  MizuFetchErrorSchema,
  MizuFetchLoggingErrorSchema,
  MizuFetchStartSchema,
  type MizuLog,
  MizuLogSchema,
  MizuRequestEndSchema,
  MizuRequestStartSchema,
  type MizuTrace,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchLoggingErrorMessage,
  MizuReqResMessageSchema,
  MizuFetchMessageSchema,
} from "./types";

const MizuRequestStartLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuRequestStartSchema,
});
type MizuRequestStartLog = z.infer<typeof MizuRequestStartLogSchema>;

const MizuRequestEndLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuRequestEndSchema,
});
type MizuRequestEndLog = z.infer<typeof MizuRequestEndLogSchema>;

const MizuFetchStartLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuFetchStartSchema,
});
type MizuFetchStartLog = z.infer<typeof MizuFetchStartLogSchema>;

const MizuFetchEndLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuFetchEndSchema,
});
type MizuFetchEndLog = z.infer<typeof MizuFetchEndLogSchema>;

const MizuFetchErrorLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuFetchErrorSchema,
});
type MizuFetchErrorLog = z.infer<typeof MizuFetchErrorLogSchema>;

const MizuFetchLoggingErrorLogSchema = MizuLogSchema.omit({
  message: true,
}).extend({
  message: MizuFetchLoggingErrorSchema,
});
type MizuFetchLoggingErrorLog = z.infer<typeof MizuFetchLoggingErrorLogSchema>;

export const isMizuRequestStartLog = (
  log: unknown,
): log is MizuRequestStartLog => {
  return MizuRequestStartLogSchema.safeParse(log).success;
};
export const isMizuRequestEndLog = (log: unknown): log is MizuRequestEndLog => {
  return MizuRequestEndLogSchema.safeParse(log).success;
};
export const isMizuFetchStartLog = (log: unknown): log is MizuFetchStartLog => {
  return MizuFetchStartLogSchema.safeParse(log).success;
};
export const isMizuFetchEndLog = (log: unknown): log is MizuFetchEndLog => {
  return MizuFetchEndLogSchema.safeParse(log).success;
};
export const isMizuFetchErrorLog = (log: unknown): log is MizuFetchErrorLog => {
  return MizuFetchErrorLogSchema.safeParse(log).success;
};
export const isMizuFetchLoggingErrorLog = (
  log: unknown,
): log is MizuFetchLoggingErrorLog => {
  return MizuFetchLoggingErrorLogSchema.safeParse(log).success;
};

const MizuRootRequestSpanLogsSchema = z.union([
  z.tuple([MizuRequestStartLogSchema]),
  z.tuple([MizuRequestStartLogSchema, MizuRequestEndLogSchema]),
]);

const MizuRootRequestSpanSchema = z
  .object({
    type: z.literal("root-request"),
    start: z.string(),
    end: z.string().optional(),
    logs: MizuRootRequestSpanLogsSchema,
  })
  .passthrough();

const MizuFetchSpanLogsSchema = z.union([
  z.tuple([MizuFetchStartLogSchema]),
  z.tuple([MizuFetchStartLogSchema, MizuFetchEndLogSchema]),
  z.tuple([MizuFetchStartLogSchema, MizuFetchErrorLogSchema]),
  z.tuple([
    MizuFetchStartLogSchema,
    MizuFetchErrorLogSchema,
    MizuFetchEndLogSchema,
  ]),
  z.tuple([MizuFetchStartLogSchema, MizuFetchLoggingErrorLogSchema]),
]);

const MizuFetchSpanSchema = z
  .object({
    type: z.literal("fetch"),
    start: z.string(),
    end: z.string().optional(),
    logs: MizuFetchSpanLogsSchema,
  })
  .passthrough();

type MizuFetchSpanLogs = z.infer<typeof MizuFetchSpanLogsSchema>;
type MizuFetchSpan = z.infer<typeof MizuFetchSpanSchema>;

type MizuRootRequestSpanLogs = z.infer<typeof MizuRootRequestSpanLogsSchema>;
type MizuRootRequestSpan = z.infer<typeof MizuRootRequestSpanSchema>;

export const isMizuRootRequestSpan = (
  span: unknown,
): span is MizuRootRequestSpan => {
  return MizuRootRequestSpanSchema.safeParse(span).success;
};

export const isMizuFetchSpan = (span: unknown): span is MizuFetchSpan => {
  return MizuFetchSpanSchema.safeParse(span).success;
};

const MizuSpanSchema = z.discriminatedUnion("type", [
  MizuRootRequestSpanSchema,
  MizuFetchSpanSchema,
]);

type MizuSpan = z.infer<typeof MizuSpanSchema>;

export const isMizuSpan = (s: unknown): s is MizuSpan => {
  return MizuSpanSchema.safeParse(s).success;
};

// TODO - Define all log messages that are not part of spans, aka "orphan logs"

const MizuSpannableMessageSchema = z.union([
  MizuReqResMessageSchema,
  MizuFetchMessageSchema,
]);

const MizuOrphanLogMessageSchema = z.union([
  MizuErrorMessageSchema,
  z.string(),
  z.null(),
  z
    .object({})
    .passthrough(), // HACK - catch all other messages
]).refine(
  (data) => !MizuSpannableMessageSchema.safeParse(data).success,
  {
    message: "Log entry should not be spannable",
  }
);

const MizuOrphanLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuOrphanLogMessageSchema,
});

type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

type MizuWaterfall = Array<MizuSpan | MizuOrphanLog>;

export type MizuTraceV2 = MizuTrace & {
  spans: MizuSpan[];
  orphanLogs: MizuOrphanLog[];
  waterfall: MizuWaterfall;
};

export function useMizuTracesV2() {
  const mizuTracesQuery = useMizuTraces();
  const dataV2 = useMemo(() => {
    if (!mizuTracesQuery.data) {
      return mizuTracesQuery.data;
    }

    return mizuTracesQuery.data.map((trace) => {
      const spans: MizuSpan[] = [];
      const orphanLogs: MizuOrphanLog[] = [];
      const logs: MizuLog[] = trace.logs;
      for (const l of logs) {
        if (isMizuRequestStartLog(l)) {
          spans.push(createRootRequestSpan(l, logs));
        }
        if (isMizuFetchStartLog(l)) {
          const fetchSpan = createFetchSpan(l, l.message.requestId, logs);
          if (fetchSpan) {
            spans.push(fetchSpan);
          }
        }
        if (isMizuOrphanLog(l)) {
          orphanLogs.push(l);
        }
      }

      const waterfall: MizuWaterfall = [...spans, ...orphanLogs];

      waterfall.sort((a, b) => {
        const aStart = isMizuSpan(a) ? a.start : a.timestamp;
        const bStart = isMizuSpan(b) ? b.start : b.timestamp;
        return new Date(aStart).getTime() - new Date(bStart).getTime();
      });

      return {
        ...trace,
        spans,
        orphanLogs,
        waterfall,
      };
    }) as MizuTraceV2[];
  }, [mizuTracesQuery.data]);
  return { ...mizuTracesQuery, data: dataV2 };
}

function createRootRequestSpan(log: MizuRequestStartLog, logs: MizuLog[]) {
  let response: MizuRequestEndLog | undefined;
  for (const log of logs) {
    if (isMizuRequestEndLog(log)) {
      response = log;
      break;
    }
  }
  const spanLogs: MizuRootRequestSpanLogs = response ? [log, response] : [log];
  return {
    type: "root-request" as const,
    start: log.timestamp,
    end: response?.timestamp,
    logs: spanLogs,
  };
}

function createFetchSpan(
  fetchStartLog: MizuFetchStartLog,
  requestId: string,
  logs: MizuLog[],
) {
  let responseSuccessLog: MizuFetchEndLog | undefined;
  let reponseErrorLog: MizuFetchErrorLog | undefined;
  let responseFatalErrorLog: MizuFetchLoggingErrorLog | undefined;
  for (const l of logs) {
    if (isMizuFetchEndLog(l)) {
      if (l.message.requestId === requestId) {
        responseSuccessLog = l;
      }
    }
    if (isMizuFetchErrorLog(l)) {
      if (l.message.requestId === requestId) {
        reponseErrorLog = l;
      }
    }
    if (isMizuFetchLoggingErrorLog(l)) {
      if (l.message.requestId === requestId) {
        responseFatalErrorLog = l;
      }
    }
  }

  let spanLogs: MizuFetchSpanLogs;

  if (responseFatalErrorLog) {
    spanLogs = [fetchStartLog, responseFatalErrorLog];
  } else if (responseSuccessLog && reponseErrorLog) {
    spanLogs = [
      // HACK - Deals with error on the api side that double logs the error and the success
      fetchStartLog,
      reponseErrorLog,
      responseSuccessLog,
    ];
  } else if (responseSuccessLog) {
    spanLogs = [fetchStartLog, responseSuccessLog];
  } else if (reponseErrorLog) {
    spanLogs = [fetchStartLog, reponseErrorLog];
  } else {
    console.debug("Something was wrong with the fetch span...", {
      fetchStartLog,
      reponseErrorLog,
      responseSuccessLog,
      responseFatalErrorLog,
    });
    return null;
  }

  const end = spanLogs?.find(
    (l) =>
      isMizuFetchEndMessage(l?.message) ||
      isMizuFetchErrorMessage(l?.message) ||
      isMizuFetchLoggingErrorMessage(l?.message),
  )?.timestamp;

  return {
    type: "fetch" as const,
    start: fetchStartLog.timestamp,
    end,
    logs: spanLogs,
  };
}
