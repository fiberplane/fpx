import {
  getRequestMethod,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  hasHttpError,
  isErrorLogEvent,
  isFetchSpan,
} from "@/pages/RequestDetailsPage/v2/otel-helpers";
import { type OtelSpans, useOtelTrace } from "@/queries";
import { formatHeaders, redactSensitiveHeaders } from "@/utils";
import { useMemo } from "react";
import type { Requestornator } from "../queries";
import { appRequestToHttpRequest, appResponseToHttpRequest } from "./utils";

function createRequestDescription(request: Requestornator | null): string {
  if (!request) {
    return "NO_MATCHING_REQUEST_FOUND";
  }

  const appRequest = request.app_requests;
  const route = appRequest?.requestRoute;

  return [
    `<matched-route>${route}</matched-route>`,
    appRequestToHttpRequest(request),
  ].join("\n");
}

function createResponseDescription(response: Requestornator | null) {
  if (!response) {
    return "NO_MATCHING_RESPONSE_FOUND";
  }
  return appResponseToHttpRequest(response);
}

export function usePrompt(
  latestRequest: Requestornator | null,
  userInput: string,
) {
  const traceId = latestRequest?.app_responses?.traceId ?? "";
  const { data: trace } = useOtelTrace(traceId);

  const requestDescription = createRequestDescription(latestRequest);
  const responseDescription = createResponseDescription(latestRequest);
  const appLogs = trace ? serializeTraceForLLM(trace) : "NO_LOGS_FOUND";

  const prompt = useMemo(() => {
    return createTestPrompt(
      requestDescription,
      responseDescription,
      appLogs,
      userInput,
    );
  }, [requestDescription, responseDescription, appLogs, userInput]);

  return prompt;
}

function createTestPrompt(
  requestDescription: string,
  responseDescription: string,
  appLogs: string,
  userInput: string,
) {
  return cleanPrompt(
    `
I tested my API with the following request

${requestDescription}

And I got the following response:

${responseDescription}

My app produced the following error logs and exceptions:

<app-logs>
${appLogs}
</app-logs>

Please write one or several tests for my api route based off of what I say below.
When possible, follow conventions used in my codebase's test files.

${userInput}
`.trim(),
  );
}

// FIXME - Trimming whitespace could mess up data we're injecting
function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trimStart())
    .join("\n");
}

// NOTE - This only focuses on exceptions! Will need to improve it in the future
// TODO - Also add error logs or fetch errors
function serializeTraceForLLM(trace: OtelSpans) {
  const events = trace.flatMap((span) => span.events);
  const exceptions = events.filter((event) => event.name === "exception");
  const exceptionsContext = exceptions.reduce(
    (result, exception) => {
      result.push(
        trimLines(`
      <Exception>
      Message: ${JSON.stringify(exception?.attributes?.message)}
      Stack: ${JSON.stringify(exception?.attributes?.stacktrace)}
      </Exception>
      `),
      );
      return result;
    },
    [] as Array<string>,
  );

  // TODO - Find out why error logs are so much less helpful with otel middleware
  const errorLogs = events.filter(isErrorLogEvent);
  const errorLogsContext = errorLogs.reduce(
    (result, log) => {
      result.push(
        trimLines(`
      <ErrorLog>
      Message: ${log?.attributes?.message}
      Arguments: ${log?.attributes?.arguments}
      </ErrorLog>
      `),
      );
      return result;
    },
    [] as Array<string>,
  );

  // TODO - Serialize fetches somehow for context
  //
  const fetches = trace.filter(isFetchSpan);
  const errorFetches = fetches.filter(hasHttpError);
  const fetchContext = errorFetches.reduce(
    (result, fetchSpan) => {
      result.push(
        trimLines(`
      <FetchError>
      ${getRequestMethod(fetchSpan)} ${getRequestUrl(fetchSpan)}
      <headers>
        ${formatHeaders(redactSensitiveHeaders(getResponseHeaders(fetchSpan)) ?? {})}
      </headers>
      <body>
        ${getResponseBody(fetchSpan)}
      </body>
      </FetchError>
      `),
      );
      return result;
    },
    [] as Array<string>,
  );

  return [...exceptionsContext, ...errorLogsContext, ...fetchContext].join(
    "\n",
  );
}

function trimLines(input: string) {
  return input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
