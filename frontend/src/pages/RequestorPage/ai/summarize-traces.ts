import {
  MizuTrace,
  isMizuErrorMessage,
  isMizuFetchEndMessage,
  isMizuFetchErrorMessage,
  isMizuFetchStartMessage,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
} from "@/queries";
import { fetchSourceLocation } from "@/queries";
import { useQuery } from "@tanstack/react-query";

async function summarizeError(trace?: MizuTrace) {
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

  return fetch(`/v0/summarize-trace-error/${trace?.id}`, {
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
export function serializeTraceForLLM(trace: MizuTrace) {
  return trace.logs.reduce(
    (result, log) => {
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
