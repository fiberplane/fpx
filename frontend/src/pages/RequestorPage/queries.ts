import {
  MizuTrace,
  isMizuErrorMessage,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
  useMizuTraces,
} from "@/queries";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { KeyValueParameter, reduceKeyValueParameters } from "./KeyValueForm";

export type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
  handlerType: "route" | "middleware";
  currentlyRegistered: boolean;
};

export type Requestornator = {
  // TODO
  app_requests: {
    id: number;
    requestUrl: string;
    requestMethod: string;
    updatedAt: string;
  };
  // NOTE - can be undefined if request failed, at least that happened to me locally
  app_responses: {
    id: number;
    responseStatusCode: string;
    responseBody: string;
    responseHeaders: Record<string, string>;
    traceId: string;
    updatedAt: string;
  };
};

const REQUESTOR_REQUESTS_KEY = "requestorRequests";

export function getUrl(path?: string) {
  return `http://localhost:8787${path ?? ""}`;
}

function getProbedRoutes(): Promise<ProbedRoute[]> {
  return fetch("/v0/app-routes").then((r) => r.json());
}

export function useProbedRoutes() {
  return useQuery({
    queryKey: ["appRoutes"],
    queryFn: getProbedRoutes,
  });
}

export function useFetchRequestorRequests() {
  return useQuery({
    queryKey: [REQUESTOR_REQUESTS_KEY],
    queryFn: () => fetch("/v0/all-requests").then((r) => r.json()),
  });
}

export function useMakeRequest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: makeRequest,
    onSuccess: () => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({ queryKey: [REQUESTOR_REQUESTS_KEY] });
    },
  });

  return mutation;
}

export function makeRequest({
  path,
  method,
  body,
  headers,
  queryParams,
}: {
  path: string;
  method: string;
  body: string;
  headers: KeyValueParameter[];
  queryParams: KeyValueParameter[];
}) {
  return fetch("/v0/send-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestUrl: getUrl(path),
      requestMethod: method,
      requestBody: method === "GET" ? undefined : body,
      requestHeaders: reduceKeyValueParameters(headers),
      requestQueryParams: reduceKeyValueParameters(queryParams),
    }),
  }).then((r) => r.json());
}

// const generateRequest = ({ meta }: { meta?: QueryMeta }) => {
//   const handler = meta?.handler;
//   console.log("HIII META", meta)
//   return fetch("/v0/generate-request", { method: "POST", body: JSON.stringify({ handler })}).then((r) => r.json());
// }

const generateRequest = (
  route: ProbedRoute | null,
  history: Array<Requestornator>,
) => {
  // FIXME - type wonkiness
  const { handler, method, path } = route ?? {};
  const simplifiedHistory = history.map((h) =>
    [
      `[Request]`,
      `${h.app_requests.requestMethod} ${h.app_requests.requestUrl}`,
      `[Response]`,
      `Status: ${h.app_responses.responseStatusCode}`,
      `Body: ${h.app_responses.responseBody}`,
    ].join("\n***\n"),
  );
  return fetch("/v0/generate-request", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ handler, method, path, history: simplifiedHistory }),
  }).then((r) => r.json());
};

export function useGenerateRequest(
  route: ProbedRoute | null,
  history: Array<Requestornator>,
) {
  return useQuery({
    queryKey: ["generateRequest"],
    queryFn: () => generateRequest(route, history),
    enabled: false,
  });
}

export function useTrace(traceId: string) {
  const { data: traces, isLoading, error } = useMizuTraces();
  const trace = traces?.find((t) => t.id === traceId);
  const isNotFound = !trace && !error && !isLoading;
  return {
    trace,
    isNotFound,
    isLoading,
    error,
  };
}

function getHandlerFromTrace(trace: MizuTrace) {
  for (const log of trace.logs) {
    if (isMizuRequestEndMessage(log.message)) {
      return log.message.handler;
    }
  }
}

function getSourceFileFromTrace(trace: MizuTrace) {
  for (const log of trace.logs) {
    if (isMizuRequestStartMessage(log.message)) {
      return log.message.file;
    }
  }
}

async function summarizeError(trace?: MizuTrace) {
  if (!trace) {
    return null;
  }
  const source = getSourceFileFromTrace(trace);
  const compiledHandler = getHandlerFromTrace(trace);

  // NOTE - if this takes too long just send the compiled js instead of the source func
  let handler = await fetchSourceLocation(source, compiledHandler);
  if (!handler) {
    handler = compiledHandler;
  }

  console.log("sending handler", handler);
  // TODO - get source code

  const simplifiedTrace = trace.logs.reduce(
    (result, log) => {
      // Req/res trace
      if (isMizuRequestStartMessage(log?.message)) {
        // TODO - add query params and request body
        result.push(trimLines(`Request received: ${log?.message?.path}`));
      }
      if (isMizuRequestEndMessage(log?.message)) {
        // TODO - add path instead of route?
        result.push(
          trimLines(
            `Response sent: ${log?.message?.status} ${log?.message?.route}`,
          ),
        );
      }

      // Error logs
      if (isMizuErrorMessage(log?.message)) {
        // TODO - Format better? What
        result.push(
          trimLines(`
        <ErrorLog>
        Message: ${log?.message?.message}
        Stack: ${log?.message?.stack}
        </ErrorLog>
      `),
        );
      }

      // Fetch logs
      if (isMizuFetchStartMessage(log?.message)) {
        // TODO - format like raw request?
        result.push(
          trimLines(`
        <FetchStart>
        ${log?.message?.method} ${log?.message?.url}
        <headers>
          ${JSON.stringify(log?.message?.headers)}
        </headers>
        <body>
          ${JSON.stringify(log?.message?.body)}
        </body>
        </FetchStart>
      `),
        );
      }
      if (isMizuFetchErrorMessage(log?.message)) {
        result.push(
          trimLines(`
        <FetchError>
        ${log?.message?.status} ${log?.message?.url}
        <headers>
          ${JSON.stringify(log?.message?.headers)}
        </headers>
        <body>
          ${JSON.stringify(log?.message?.body)}
        </body>
        </FetchError>
      `),
        );
      }
      if (isMizuFetchEndMessage(log?.message)) {
        result.push(
          trimLines(`
        <FetchError>
        ${log?.message?.status} ${log?.message?.url}
        <headers>
          ${JSON.stringify(log?.message?.headers)}
        </headers>
        <body>
          ${JSON.stringify(log?.message?.body)}
        </body>
        </FetchError>
      `),
        );
      }
      return result;
    },
    [] as Array<string>,
  );

  return fetch("/v0/summarize-trace-error", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      handlerSourceCode: handler,
      trace: simplifiedTrace,
    }),
  }).then((r) => r.json());
}

export function useSummarizeError(trace?: MizuTrace) {
  return useQuery({
    queryKey: ["summarizeError"],
    queryFn: () => summarizeError(trace),
    enabled: false,
  });
}

function trimLines(input: string) {
  return input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

async function fetchSourceLocation(
  source: string | undefined,
  handler: string | undefined,
) {
  if (!source) {
    return handler;
  }
  if (!handler) {
    return handler;
  }
  const query = new URLSearchParams({
    source,
    handler,
  });
  try {
    const pos = await fetch(`/v0/source-function?${query.toString()}`, {
      method: "POST",
    }).then((r) => {
      if (!r.ok) {
        throw new Error(
          `Failed to fetch source location from source map: ${r.status}`,
        );
      }
      return r.json().then((r) => r.functionText);
    });
    return pos;
  } catch (err) {
    console.debug("Could not fetch source location from source map", err);
    return null;
  }
}
