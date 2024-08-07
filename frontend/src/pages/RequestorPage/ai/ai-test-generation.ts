import {
  MizuTrace,
  isMizuErrorMessage,
  isMizuFetchErrorMessage,
} from "@/queries";
import { redactSensitiveHeaders } from "@/utils";
import { useCallback, useMemo, useState } from "react";
import { Requestornator, useTrace } from "../queries";
import { appRequestToHttpRequest, appResponseToHttpRequest } from "./utils";

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function createRequestDescription(request: Requestornator): string {
  const appRequest = request?.app_requests;
  const route = appRequest?.requestRoute;

  return [
    `<matched-route>${route}</matched-route>`,
    appRequestToHttpRequest(request),
  ].join("\n");
}

function createResponseDescription(response: Requestornator) {
  return appResponseToHttpRequest(response);
}

export function usePrompt(latestRequest: Requestornator, userInput: string) {
  const traceId = latestRequest?.app_responses?.traceId;
  const { trace } = useTrace(traceId);

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

My app produced these logs:

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

// Simplified version of serializeTraceForLLM from summarize-traces.ts
// This only focuses on errors!!
// Will need to improve it in the future
function serializeTraceForLLM(trace: MizuTrace) {
  return trace.logs
    .reduce(
      (result, log) => {
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

        if (isMizuFetchErrorMessage(log?.message)) {
          result.push(
            trimLines(`
        <FetchError>
        ${log?.message?.status} ${log?.message?.url}
        <headers>
          ${formatHeaders(redactSensitiveHeaders(log?.message?.headers) ?? {})}
        </headers>
        <body>
          ${log?.message?.body}
        </body>
        </FetchError>
      `),
          );
        }

        return result;
      },
      [] as Array<string>,
    )
    .join("\n");
}

function trimLines(input: string) {
  return input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    if (!navigator.clipboard) {
      console.error("Clipboard API not available");
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset the copied state after 2 seconds
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      },
    );
  }, []);

  return { isCopied, copyToClipboard };
}
