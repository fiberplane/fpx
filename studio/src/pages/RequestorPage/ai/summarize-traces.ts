import {
  getErrorEvents,
  getRequestMethod,
  getRequestPath,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
} from "@/utils";
import { formatHeaders, redactSensitiveHeaders } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

/**
 * This turns a MizuTrace into something a little more digestible for an LLM.
 *
 * Only doing the following
 * - Request start, Request end
 * - Fetch-related events
 * - Error logs
 */
export function serializeTraceForLLM(trace: Array<OtelSpan>) {
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

function trimLines(input: string) {
  return input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
