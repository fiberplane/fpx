import { useMemo } from "react";
import { z } from "zod";

import {
  EXTRA_SEMATTRS_HTTP_REQUEST_METHOD,
  EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE,
  FPX_REQUEST_BODY,
  FPX_REQUEST_PATHNAME,
  FPX_REQUEST_SCHEME,
  FPX_REQUEST_SEARCH,
  FPX_RESPONSE_BODY,
  SpanKind,
  SpanStatus,
} from "@/constants";
import {
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH,
  SEMATTRS_HTTP_URL,
  SEMATTRS_NET_HOST_NAME,
  SEMATTRS_NET_HOST_PORT,
} from "@opentelemetry/semantic-conventions";
import { useMizuTraces } from "./queries";
import {
  OtelAttributes,
  OtelSpan,
  OtelSpanSchema,
  OtelStatus,
} from "./traces-otel";
import {
  MizuErrorMessageSchema,
  MizuFetchEndSchema,
  MizuFetchErrorSchema,
  MizuFetchLoggingErrorSchema,
  MizuFetchMessageSchema,
  MizuFetchStartSchema,
  type MizuLog,
  MizuLogSchema,
  MizuReqResMessageSchema,
  MizuRequestEndSchema,
  MizuRequestStartSchema,
  type MizuTrace,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchLoggingErrorMessage,
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

const MizuRootRequestSpanSchema = OtelSpanSchema.extend({
  // FIRST PASS: This can go away
  type: z.literal("root-request"),
  start: z.string(),
  end: z.string().optional(),
  logs: MizuRootRequestSpanLogsSchema,
}).passthrough();

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

const MizuFetchSpanSchema = OtelSpanSchema.extend({
  type: z.literal("fetch"),
  start: z.string(),
  end: z.string().optional(),
  logs: MizuFetchSpanLogsSchema,
}).passthrough();

type MizuFetchSpanLogs = z.infer<typeof MizuFetchSpanLogsSchema>;
export type MizuFetchSpan = z.infer<typeof MizuFetchSpanSchema>;

type MizuRootRequestSpanLogs = z.infer<typeof MizuRootRequestSpanLogsSchema>;
export type MizuRootRequestSpan = z.infer<typeof MizuRootRequestSpanSchema>;

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

export type MizuSpan = z.infer<typeof MizuSpanSchema>;

export const isMizuSpan = (s: unknown): s is MizuSpan => {
  return MizuSpanSchema.safeParse(s).success;
};

// TODO - Define all log messages that are not part of spans, aka "orphan logs"

const MizuSpannableMessageSchema = z.union([
  MizuReqResMessageSchema,
  MizuFetchMessageSchema,
]);

const MizuOrphanLogMessageSchema = z
  .union([
    MizuErrorMessageSchema,
    z.string(),
    z.null(),
    z
      .object({})
      .passthrough(), // HACK - catch all other messages
  ])
  .refine((data) => !MizuSpannableMessageSchema.safeParse(data).success, {
    message: "Log entry should not be spannable",
  });

const MizuOrphanLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuOrphanLogMessageSchema,
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

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
      const spans: OtelSpan[] = [];
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


      return {
        id: trace.id,
        spans,
        orphanLogs,
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

  // TODO - Factor this out into a helper
  const status: OtelStatus = fpxRootResponseLogToOtelStatus(response);
  const attributes = fpxRootResponseToHttpAttributes(log, response);

  const spanLogs: MizuRootRequestSpanLogs = response ? [log, response] : [log];

  return {
    trace_id: log.traceId,
    span_id: `${log.traceId}-${log.id}`,
    parent_span_id: null,
    name: "Request",
    trace_state: "", // This is for cross-vendor interop, allowing vendors to add their own context id
    flags: 1, // This means "sample this trace"
    kind: SpanKind.SERVER, // This means we're tracking a request that came from the outside
    start_time: log.timestamp,
    // HACK - The current data model might not have an outgoing (rare), so just adding this to be thorough
    end_time: response?.timestamp ?? new Date("2029-01-01").toISOString(),
    // NOTE - Still massaging the attributes, but these should have all the data we need to power the UI
    attributes,
    // NOTE - This is the otel status, not an http status
    status,
    // TODO - append any console.logs
    events: [],
    // TODO - not sure how we'll use this
    links: [],

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
  let status: OtelStatus;
  let attributes: OtelAttributes;
  if (responseFatalErrorLog) {
    spanLogs = [fetchStartLog, responseFatalErrorLog];
    status = fpxFetchResponseLogToOtelStatus(responseFatalErrorLog);
    attributes = fpxFetchResponseToHttpAttributes(
      fetchStartLog,
      responseFatalErrorLog,
    );
  } else if (responseSuccessLog && reponseErrorLog) {
    spanLogs = [
      // HACK - Deals with error on the api side that double logs the error and the success
      fetchStartLog,
      reponseErrorLog,
      responseSuccessLog,
    ];
    status = fpxFetchResponseLogToOtelStatus(reponseErrorLog);
    // HACK - Check if this actually works... should really fix the middleware huh
    attributes = {
      ...fpxFetchResponseToHttpAttributes(fetchStartLog, responseSuccessLog),
      ...fpxFetchResponseToHttpAttributes(fetchStartLog, reponseErrorLog),
    };
  } else if (responseSuccessLog) {
    spanLogs = [fetchStartLog, responseSuccessLog];
    status = fpxFetchResponseLogToOtelStatus(responseSuccessLog);
    attributes = fpxFetchResponseToHttpAttributes(
      fetchStartLog,
      responseSuccessLog,
    );
  } else if (reponseErrorLog) {
    spanLogs = [fetchStartLog, reponseErrorLog];
    status = fpxFetchResponseLogToOtelStatus(reponseErrorLog);
    attributes = fpxFetchResponseToHttpAttributes(
      fetchStartLog,
      reponseErrorLog,
    );
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
    trace_id: fetchStartLog.traceId,
    span_id: `${fetchStartLog.traceId}-${requestId}`,
    // TODO - Assign to the root request
    parent_span_id: null,
    // TODO - Make this dynamic based on type of request
    name: "Fetch",
    trace_state: "", // NOTE - This is for Cross-Vendor Interoperability, allowing vendors to add their own context id
    flags: 1, // This means "sample this trace"
    kind: SpanKind.CLIENT, // This means we're making a request to an external service
    start_time: fetchStartLog.timestamp,
    // HACK - The current data model might not have an outgoing, just adding this as a temporary hack
    end_time: end ?? new Date("2029-01-01").toISOString(),
    // TODO - Add http status codes when we know the right attr names to add
    attributes,
    // TODO - make it an error if the response is an error!!!
    status,
    // TODO - append any errors, etc
    events: [],
    // TODO - not sure how we'll use this
    links: [],

    type: "fetch" as const,
    start: fetchStartLog.timestamp,
    end,
    logs: spanLogs,
  };
}

function fpxRootResponseLogToOtelStatus(log?: MizuRequestEndLog) {
  if (isMizuRequestEndLog(log)) {
    const statusCode = parseInt(log.message.status);
    if (statusCode && statusCode < 400) {
      return { code: SpanStatus.OK, message: `HTTP ${statusCode}` };
    } else if (statusCode && statusCode >= 400) {
      return { code: SpanStatus.ERROR, message: `HTTP ${statusCode}` };
    }
  }

  return {
    code: SpanStatus.ERROR,
    message: "Unknown response status (data not found)",
  };
}

const safeToQueryComponent = (
  queryParams: Record<string, string> | null | undefined,
) => {
  if (!queryParams) {
    return "";
  }
  try {
    return new URLSearchParams(queryParams).toString();
  } catch (error) {
    console.error("Invalid query params:", queryParams, error);
    return "";
  }
};

/**
 * TODO - We need to align with rust collector and fpx middleware on how we will store http request data
 */
function fpxRootResponseToHttpAttributes(
  request: MizuRequestStartLog,
  response?: MizuRequestEndLog,
) {
  const hostHeader =
    request.message.headers.host || request.message.headers["x-forwarded-host"];
  const [host, port] = hostHeader.split(":");
  const scheme = request.message.headers["x-forwarded-proto"] || "http";
  const path = request.message.path;
  const queryParams = request.message.query;
  const searchParams = safeToQueryComponent(queryParams);
  const url = constructHttpUrlForRootRequest(host, scheme, path, queryParams);

  const attributes: OtelAttributes = {
    [EXTRA_SEMATTRS_HTTP_REQUEST_METHOD]: {
      String: request.message.method,
    },
    [SEMATTRS_HTTP_URL]: {
      String: url,
    },

    [FPX_REQUEST_SEARCH]: {
      String: searchParams,
    },

    [FPX_REQUEST_PATHNAME]: {
      String: path,
    },
    [FPX_REQUEST_SCHEME]: {
      String: scheme,
    },

    // "server.address": host,
    [SEMATTRS_NET_HOST_NAME]: {
      String: host,
    },
    // "server.port": port,
    [SEMATTRS_NET_HOST_PORT]: {
      Int: Number.parseInt(port, 10),
    },

    // TODO
    // "error.type": "",

    // Experimental
    // "http.request.body.size": "",
    // "http.request.size": "",
    // "http.response.body.size": "",
    // "http.response.size": "",

    // HACK - We can't have nested dictionaries, so json stringify here?
    "fpx.params": {
      String: JSON.stringify(request.message.params),
    },
    // HACK - We can't have nested dictionaries, so json stringify here?
    "fpx.query": {
      String: JSON.stringify(request.message.query),
    },
    // "fpx.request.body": request.message.body,
    // "fpx.response.body": response?.message?.body,
  };

  const statusCode = response?.message.status
    ? Number.parseInt(response?.message?.status)
    : undefined;
  if (statusCode !== undefined && !Number.isNaN(statusCode)) {
    attributes[EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE] = {
      Int: statusCode,
    };
  }

  const responseContentLength = response?.message?.body?.length;
  if (responseContentLength !== undefined) {
    attributes[SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH] = {
      Int: responseContentLength,
    };
  }

  if (request.message.body !== undefined) {
    attributes[FPX_REQUEST_BODY] = {
      String: request.message.body,
    };
  }

  if (typeof response?.message?.body === "string") {
    attributes[FPX_RESPONSE_BODY] = {
      String: response?.message?.body,
    };
  }

  let headerObject: Record<string, string> = {};
  for (const [header, value] of Object.entries(request.message.headers)) {
    headerObject[header] = value;
    attributes[`http.request.header.${header}`] = {
      String: value,
    };
  }

  headerObject = {};
  for (const [responseHeader, value] of Object.entries(
    response?.message?.headers ?? {},
  )) {
    headerObject[responseHeader] = value;
    attributes[`http.response.header.${responseHeader}`] = {
      String: value,
    };
  }

  return attributes;
}

function constructHttpUrlForRootRequest(
  host: string,
  scheme: string,
  path: string,
  queryParams?: Record<string, string> | null,
): string {
  let url = path;
  if (host && scheme) {
    url = `${scheme}://${host}${path}`;
  }
  if (queryParams) {
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return url;
}

function fpxFetchResponseLogToOtelStatus(
  log?: MizuFetchEndLog | MizuFetchErrorLog | MizuFetchLoggingErrorLog,
) {
  if (isMizuFetchEndLog(log)) {
    const statusCode =
      typeof log.message.status === "number"
        ? log.message.status
        : parseInt(log.message.status);
    if (statusCode >= 400) {
      return { code: SpanStatus.ERROR, message: `HTTP ${statusCode}` };
    }
    return { code: SpanStatus.OK, message: "" };
  }
  if (isMizuFetchErrorLog(log)) {
    return { code: SpanStatus.ERROR, message: "Fetch error" };
  }
  if (isMizuFetchLoggingErrorLog(log)) {
    return { code: SpanStatus.ERROR, message: "Fetch logging error" };
  }
  return {
    code: SpanStatus.ERROR,
    message: "Unknown response status (data not found)",
  };
}

/**
 * TODO - We need to align with rust collector and fpx middleware on how we will store http request data
 */
function fpxFetchResponseToHttpAttributes(
  request: MizuFetchStartLog,
  response?: MizuFetchEndLog | MizuFetchErrorLog | MizuFetchLoggingErrorLog,
): OtelAttributes {
  const parsedUrl = safeParseUrl(request.message.url);
  // https://opentelemetry.io/docs/specs/semconv/http/http-spans/
  const commonAttributes: OtelAttributes = {
    [EXTRA_SEMATTRS_HTTP_REQUEST_METHOD]: {
      String: request.message.method,
    },
    // "http.request.method": ,
    // TODO - (optional) We could also parse this to only record the request path and query string without the protocol and domain
    [SEMATTRS_NET_HOST_NAME]: {
      String: parsedUrl.host || request.message.headers.host,
    },
    // TODO
    // "server.port": "",
    // TODO - Add query params
    // "url.full": request.message.url,
    [SEMATTRS_HTTP_URL]: {
      String: request.message.url,
    },

    // TODO - class of error the operation ended with
    // "error.type": "",

    // FPX
    // "fpx.request.body": request.message.body,
  };
  if (request.message.body !== null) {
    commonAttributes[FPX_REQUEST_BODY] = {
      String: request.message.body,
    };
  }

  let headerObject: Record<string, string> = {};
  for (const [header, value] of Object.entries(request.message.headers)) {
    commonAttributes[`http.request.header.${header}`] = {
      String: value,
    };
    headerObject[header] = value;
  }

  if (isMizuFetchEndLog(response)) {
    const responseHeaderAttributes: OtelAttributes = {};
    headerObject = {};
    for (const [header, value] of Object.entries(response.message.headers)) {
      headerObject[header] = value;
      responseHeaderAttributes[`http.response.header.${header}`] = {
        String: value,
      };
    }

    if (response.message.body !== null) {
      responseHeaderAttributes[FPX_RESPONSE_BODY] = {
        String: response.message.body,
      };
    }

    return {
      ...commonAttributes,
      ...responseHeaderAttributes,
      [EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE]: {
        Int: response.message.status,
      },
    };
  }

  if (isMizuFetchErrorLog(response)) {
    const responseHeaderAttributes: OtelAttributes = {};
    headerObject = {};
    for (const [header, value] of Object.entries(response.message.headers)) {
      responseHeaderAttributes[`http.response.header.${header}`] = {
        String: value,
      };
      headerObject[header] = value;
    }
    const responseBody = response.message.body;
    if (responseBody !== null) {
      commonAttributes[FPX_RESPONSE_BODY] = {
        String: responseBody,
      };
    }

    return {
      ...commonAttributes,
      ...responseHeaderAttributes,
      [EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE]: {
        Int: response.message.status,
      },
    };
  }

  // NOTE - This is the case where FPX middleware itself had an error somewhere
  //        It's bad news
  if (isMizuFetchLoggingErrorLog(response)) {
    return {
      ...commonAttributes,
    };
  }

  return commonAttributes;
}

function safeParseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.host,
      scheme: parsedUrl.protocol.replace(":", ""),
    };
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return {
      host: "",
      scheme: "",
    };
  }
}
