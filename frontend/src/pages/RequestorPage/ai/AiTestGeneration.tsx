import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import {
  MizuTrace,
  isMizuErrorMessage,
  isMizuFetchErrorMessage,
} from "@/queries";
import { CopyIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { useMemo, useState } from "react";
import { HistoryEntry } from "../RequestorHistory";
import { Requestornator, useTrace } from "../queries";

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function createRequestDescription(request: Requestornator) {
  const appRequest = request?.app_requests;

  const url = appRequest?.requestUrl;
  const route = appRequest?.requestRoute;
  const method = appRequest?.requestMethod;
  const body = appRequest?.requestBody;
  const headers = redactSensitiveHeaders(appRequest?.requestHeaders);
  const queryParams = appRequest?.requestQueryParams;

  return `
${method} ${url}${route}
===QUERY PARAMS===
${JSON.stringify(queryParams)}
===BODY===
${JSON.stringify(body)}
===HEADERS===
${headers ? formatHeaders(headers) : "<no headers>"}
`.trim();
}

function createResponseDescription(response: Requestornator) {
  const status = response?.app_responses?.responseStatusCode;
  const body = response?.app_responses?.responseBody;
  const headers = response?.app_responses?.responseHeaders;

  return `
Status: ${status}
===BODY===
${JSON.stringify(body)}
===HEADERS===
${headers ? formatHeaders(headers) : "<no headers>"}
`.trim();
}

function usePrompt(latestRequest: Requestornator, userInput: string) {
  const traceId = latestRequest?.app_responses?.traceId;
  const { trace } = useTrace(traceId);

  const prompt = useMemo(() => {
    const basePrompt = cleanPrompt(`
I have been testing my API with the following request:
${createRequestDescription(latestRequest)}

And I got the following response:
${createResponseDescription(latestRequest)}

My app produced the following logs:
${trace ? serializeTraceForLLM(trace) : "<no logs found>"}

====

Please write one or several tests for this route based off of my description below.
If possible, follow conventions used in my test files.
`);
    return `${basePrompt}\n\n${userInput}`;
  }, [userInput, latestRequest, trace]);

  return prompt;
}

export function AiTestGeneration({
  history,
}: {
  history: Array<Requestornator>;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const lastRequest = history[0];
  const traceId = lastRequest?.app_responses?.traceId;

  const [userInput, setUserInput] = useState("");

  const prompt = usePrompt(lastRequest, userInput);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Create Test</Button>
      </DrawerTrigger>
      <DrawerContent className="py-4">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="mt-2 p-2">
            <DrawerTitle>Close the Loop</DrawerTitle>
            <DrawerDescription>
              Describe the type of test test you want to generate, and
              copy-paste the prompt into your favorite IDE Copilot or LLM.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-2 pb-0">
            <div className="flex items-center">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="mt-2">
              <div className="text-xs uppercase font-bold text-gray-400">
                Additional context
              </div>
              <HistoryEntry traceId={traceId} response={lastRequest} />
            </div>
          </div>
          <DrawerFooter className="mt-4 flex flex-row justify-end px-2">
            <DrawerClose asChild>
              <Button variant="outline" className="">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="text-white"
              onClick={() => copyToClipboard(prompt)}
            >
              <CopyIcon className="h-4 w-4 mr-2" />{" "}
              {isCopied ? "Copied!" : "Copy Prompt"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function useCopyToClipboard() {
  const [isCopied, setIsCopied] = React.useState(false);

  const copyToClipboard = React.useCallback((text: string) => {
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
  return trace.logs.reduce(
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
          ${JSON.stringify(redactSensitiveHeaders(log?.message?.headers))}
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

function trimLines(input: string) {
  return input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

function redactSensitiveHeaders(headers?: null | Record<string, string>) {
  if (!headers) {
    return headers;
  }

  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
  const redactedHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      redactedHeaders[key] = 'REDACTED';
    } else {
      redactedHeaders[key] = value;
    }
  }

  return redactedHeaders;
}