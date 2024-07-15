import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiEnabled } from "@/hooks/useAiEnabled";
import {
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
  useHandlerSourceCode,
} from "@/queries";
import { cn, noop } from "@/utils";
import { CaretSortIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CodeMirrorTypescriptEditor } from "./Editors/CodeMirrorEditor";
import { EventsTable } from "./EventsTable";
import { HeaderTable } from "./HeaderTable";
import { useSummarizeError } from "./ai";
import { Requestornator, useTrace } from "./queries";

// NOTE - Useful for testing rendering of ai markdown in the DOM without hitting openai
// const MOCK_AI_SUMMARY = getMockAiSummary();

type FpxDetailsProps = {
  response?: Requestornator;
  className?: string;
};

export function FpxDetails({ response, className }: FpxDetailsProps) {
  const hasTrace = !!response?.app_responses?.traceId;
  return hasTrace ? (
    <TraceDetails response={response} className={className} />
  ) : (
    <NoTrace />
  );
}

type TraceDetailsProps = {
  response: Requestornator;
  className?: string;
};

function TraceDetails({ response, className }: TraceDetailsProps) {
  const aiEnabled = useAiEnabled();
  // HACK - Hide summaries for now because they're obtuse
  const isAiSummaryEnabled = aiEnabled && false;

  const traceId = response.app_responses.traceId;
  const { trace, isNotFound } = useTrace(traceId);

  const {
    data: aiSummary,
    isLoading: isLoadingAiSummary,
    isFetching: isFetchingAiSummary,
    isRefetching: isRefetchingAiSummary,
    refetch: fetchAiSummary,
  } = useSummarizeError(trace);

  // TODO - use query key with trace id in fetch call so we can avoid unnecessary requests when other values update...
  const lastFetchedTraceId = aiSummary?.traceId;
  useEffect(() => {
    if (
      trace &&
      trace.id !== lastFetchedTraceId &&
      isAiSummaryEnabled &&
      !isFetchingAiSummary
    ) {
      fetchAiSummary();
    }
  }, [
    trace,
    lastFetchedTraceId,
    fetchAiSummary,
    isAiSummaryEnabled,
    isFetchingAiSummary,
  ]);

  if (isNotFound) {
    return <div>Trace not found</div>;
  }

  const fpxRequestMessage = getRequestMessage(trace?.logs || []);
  const fpxResponseMessage = getResponseMessage(trace?.logs || []);
  const shouldShowSourceFunction = fpxRequestMessage && fpxResponseMessage;

  return (
    <div className={cn("mt-2", className)}>
      {isAiSummaryEnabled && (
        <div className="">
          <h3 className="pt-1 pb-2 text-sm">Summary</h3>
          <div className="font-light">
            {isLoadingAiSummary ||
            isFetchingAiSummary ||
            isRefetchingAiSummary ? (
              <div className="p2">
                <div className="text-sm text-gray-400 mb-2">
                  Loading AI Summary...
                </div>
                <Skeleton className="h-24 w-full rounded-md mb-2" />
              </div>
            ) : aiSummary && aiSummary?.summary ? (
              <AiSummary summary={aiSummary.summary} />
            ) : (
              <div className="p2">Nothing to show, soz</div>
            )}
          </div>
        </div>
      )}

      <Section title="Events" defaultIsOpen>
        <EventsTable logs={trace?.logs} />
      </Section>
      <Section title="Environment">
        <HeaderTable headers={fpxRequestMessage?.env ?? {}} />
      </Section>
      <Section title="Headers Your API Received">
        <HeaderTable headers={fpxRequestMessage?.headers ?? {}} />
      </Section>
      <Section title="Source Function">
        <div>
          {shouldShowSourceFunction ? (
            <SourceFunction
              fpxRequestMessage={fpxRequestMessage}
              fpxResponseMessage={fpxResponseMessage}
            />
          ) : (
            <div>
              Could not find source code, only compiled code:
              <CodeMirrorTypescriptEditor
                jsx
                value={fpxResponseMessage?.handler}
                readOnly
                onChange={noop}
              />
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

type SourceFunctionProps = {
  fpxRequestMessage: MizuRequestStart;
  fpxResponseMessage: MizuRequestEnd;
};
function SourceFunction({
  fpxRequestMessage,
  fpxResponseMessage,
}: SourceFunctionProps) {
  const source = fpxRequestMessage?.file;
  const handler = fpxResponseMessage?.handler;
  const handlerSourceCode = useHandlerSourceCode(source, handler) ?? "";

  return (
    <div>
      <CodeMirrorTypescriptEditor
        jsx
        value={handlerSourceCode}
        readOnly
        onChange={noop}
        minHeight="100px"
      />
    </div>
  );
}

function getRequestMessage(logs: MizuLog[]) {
  for (const log of logs) {
    if (isMizuRequestStartMessage(log.message)) {
      return log.message;
    }
  }
}

function getResponseMessage(logs: MizuLog[]) {
  for (const log of logs) {
    if (isMizuRequestEndMessage(log.message)) {
      return log.message;
    }
  }
}

function Section({
  title,
  children,
  defaultIsOpen = false,
}: { title: string; children: React.ReactNode; defaultIsOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border mt-2 px-1 pt-1 pb-2 shadow-sm">
        <SectionTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <CaretSortIcon className="h-3.5 w-3.5" />
              <span className="sr-only">Toggle</span>
              <span className="ml-2 text-sm">{title}</span>
            </Button>
          </CollapsibleTrigger>
        </SectionTitle>
        <CollapsibleContent className="">{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md mt-2 pt-1 pb-2 text-sm">{children}</div>;
}

function AiSummary({ summary }: { summary: string }) {
  return (
    <div className="text-sm font-light border p-2 rounded max-w-[680px]">
      <ReactMarkdown
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold my-2 text-gray-400" {...props} />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-semibold my-2 text-gray-400"
              {...props}
            />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h3: ({ node, ...props }) => (
            <h3
              className="text-md font-semibold mt-2 mb-1 text-gray-300"
              {...props}
            />
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" {...props} />
          ),
          code: ({ node, children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            let color = "text-red-300";
            const otherClasses: Array<string> = [];

            if (language) {
              color = "text-gray-300";
              otherClasses.push("my-3 border p-1 block rounded");
            }

            if (language === "json") {
              console.log("JSON", node, children);
              // TODO
            }
            if (language === "sql") {
              console.log("SQL", node, children);
              // TODO
            }
            if (language === "javascript") {
              console.log("javascript", node, children);
              // TODO
            }
            return (
              <code
                className={cn(className, color, ...otherClasses)}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Add more custom components as needed
        }}
      >
        {summary}
      </ReactMarkdown>
    </div>
  );
}

function NoTrace() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-400 max-h-[600px] h-full w-full lg:mb-32">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          No trace found
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Could not correlate the request with application logs or traces
        </div>
      </div>
    </div>
  );
}
