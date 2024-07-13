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
import { redactSensitiveHeaders } from "@/utils";
import { CopyIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { useMemo, useState } from "react";
import { HistoryEntry } from "../RequestorHistory";
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

function usePrompt(latestRequest: Requestornator, userInput: string) {
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
              Describe the problem you encountered or test test you wish to
              generate, and copy-paste a context-rich prompt into your favorite
              Copilot or LLM.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-2 pb-0">
            <div className="flex items-center">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full"
                placeholder={
                  'For example: "I expected to get a 404, but the api returned a 500"'
                }
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
