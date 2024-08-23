import {
  FPX_REQUEST_HANDLER_FILE,
  FPX_REQUEST_HANDLER_SOURCE_CODE,
} from "@/constants";
import {
  getErrorEvents,
  getRequestMethod,
  getRequestPath,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
  getString,
} from "@/utils";
import { OtelSpans } from "@/queries";
import { fetchSourceLocation } from "@/queries";
import { formatHeaders, redactSensitiveHeaders } from "@/utils";
import { useQuery } from "@tanstack/react-query";

async function summarizeError(trace?: OtelSpans) {
  if (!trace) {
    return null;
  }

  const source = getSourceFileFromTrace(trace);
  const compiledHandler = getHandlerFromTrace(trace);

  // NOTE - If this takes too long, we can just send the compiled js instead of the source func
  //
  // At any rate, we'll try to fetch the source code here, and fall back to the compiled js
  let handlerCode = await fetchSourceLocation(source, compiledHandler);
  if (!handlerCode) {
    handlerCode = compiledHandler ?? null;
  }

  // This serializes events from the trace in a format that's a bit more digestible for an LLM
  const simplifiedTrace = serializeTraceForLLM(trace);

  return fetch(`/v0/summarize-trace-error/${trace?.[0].trace_id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      handlerSourceCode: handlerCode,
      trace: simplifiedTrace,
    }),
  }).then((r) => r.json());
}

/**
 * This turns a MizuTrace into something a little more digestible for an LLM.
 *
 * Only doing the following
 * - Request start, Request end
 * - Fetch-related events
 * - Error logs
 */
export function serializeTraceForLLM(trace: OtelSpans) {
  return trace.reduce(
    (result, span) => {
      if (span.name === "request") {
        // TODO - add query params and request body
        const path = getRequestPath(span);
        const method = getRequestMethod(span);
        const status = getStatusCode(span);
        result.push(trimLines(`Request received:  ${method} ${path}`));

        // TODO - Add route! Somehow!
        result.push(trimLines(`Response sent: ${status}`));
      }

      const errors = getErrorEvents(span);

      for (const error of errors) {
        // ...
        if (error.name === "exception") {
          result.push(
            trimLines(`
            <Exception>
            Message: ${JSON.stringify(error?.attributes?.message)}
            Stack: ${JSON.stringify(error?.attributes?.stacktrace)}
            </Exception>
            `),
          );
        }
        if (error.name === "log") {
          result.push(
            trimLines(`
            <ErrorLog>
            Message: ${error?.attributes?.message}
            Arguments: ${error?.attributes?.arguments}
            </ErrorLog>
            `),
          );
        }
      }

      if (span.name === "fetch") {
        result.push(
          trimLines(`
            <FetchStart>
            ${getRequestMethod(span)} ${getRequestUrl(span)}
            <headers>
              ${formatHeaders(redactSensitiveHeaders(getResponseHeaders(span)) ?? {})}
            </headers>
            <body>
              ${getResponseBody(span)}
            </body>
            </FetchStart>
          `),
        );

        if (getStatusCode(span) >= 400) {
          result.push(
            trimLines(`
              <FetchError>
              ${getRequestMethod(span)} ${getRequestUrl(span)}
              <headers>
                ${formatHeaders(redactSensitiveHeaders(getResponseHeaders(span)) ?? {})}
              </headers>
              <body>
                ${getResponseBody(span)}
              </body>
              </FetchError>
              `),
          );
        } else {
          // todo
          result.push(
            trimLines(`
              <FetchEnd>
              ${getRequestMethod(span)} ${getRequestUrl(span)}
              <headers>
                ${formatHeaders(redactSensitiveHeaders(getResponseHeaders(span)) ?? {})}
              </headers>
              <body>
                ${getResponseBody(span)}
              </body>
              </FetchEnd>
            `),
          );
        }
      }

      return result;
    },
    [] as Array<string>,
  );
}

export function useSummarizeError(trace?: OtelSpans) {
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

function getHandlerFromTrace(trace: OtelSpans) {
  for (const span of trace) {
    if (span.name === "request") {
      return getString(span.attributes[FPX_REQUEST_HANDLER_SOURCE_CODE]);
    }
  }
}

function getSourceFileFromTrace(trace: OtelSpans) {
  for (const span of trace) {
    if (span.name === "request") {
      return getString(span.attributes[FPX_REQUEST_HANDLER_FILE]);
    }
  }
}
