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
  // useMizuTraces,
} from "@/queries";
import { cn } from "@/utils";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CodeMirrorTypescriptEditor } from "./Editors/CodeMirrorEditor";
import { EventsTable } from "./EventsTable";
import { HeaderTable } from "./HeaderTable";
import { Requestornator, useTrace } from "./queries";
import { useSummarizeError } from "./ai"

type FpxDetailsProps = {
  response?: Requestornator;
};

export function FpxDetails({ response }: FpxDetailsProps) {
  const hasTrace = !!response?.app_responses?.traceId;
  return (
    <div>{hasTrace ? <TraceDetails response={response} /> : "no trace"}</div>
  );
}

// NOTE - Useful for testing rendering of ai markdown in the DOM
const MOCK_AI_SUMMARY =
  "The request to `/api/geese/9876543210` resulted in a 500 error. The error occurred because the value `9876543210` is out of range for the integer type in PostgreSQL.\n\n### Suggested Fix:\nEnsure the `id` parameter is within the valid range for an integer or change the database schema to use a larger integer type (e.g., `BIGINT`).\n\n```sql\nALTER TABLE geese ALTER COLUMN id TYPE BIGINT;\n```\n\nAdditionally, you might want to validate the `id` parameter before querying the database:\n\n```javascript\nconst id = parseInt(c.req.param('id'), 10);\nif (isNaN(id) || id > Number.MAX_SAFE_INTEGER) {\n  return c.json({ message: 'Invalid ID' }, 400);\n}\n```";

type TraceDetailsProps = {
  response: Requestornator;
};

function TraceDetails({ response }: TraceDetailsProps) {
  const aiEnabled = useAiEnabled();
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
  useEffect(() => {
    if (trace && aiEnabled) {
      console.log("Fetching ai summary...");
      fetchAiSummary();
    }
  }, [fetchAiSummary, aiEnabled]);

  if (isNotFound) {
    return <div>Trace not found</div>;
  }

  const fpxRequestMessage = getRequestMessage(trace?.logs || []);
  const fpxResponseMessage = getResponseMessage(trace?.logs || []);
  const shouldShowSourceFunction = fpxRequestMessage && fpxResponseMessage;

  if (aiSummary?.summary) {
    // console.log("AI SUMMARY", aiSummary.summary);
  }

  return (
    <div>
      {aiEnabled && (
        <div className="">
          <h3 className="pt-1 pb-2 text-sm">Summary</h3>
          <div className="max-w-[600px] font-light">
            {isLoadingAiSummary ||
            isFetchingAiSummary ||
            isRefetchingAiSummary ? (
              <div className="p2">
                <div className="text-sm text-gray-400 mb-2">
                  Loading AI Summary...
                </div>
                <Skeleton className="h-24 w-[400px] rounded-md mb-2" />
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
      <Section title="Headers Received">
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
                onChange={() => {}}
              />
            </div>
          )}
        </div>
      </Section>

      {/* <h2>Headers Sent</h2> */}
      {/* <code>{JSON.stringify(fpxResponseMessage, null, 2)}</code> */}
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

  // TODO - Use CodeMirror
  return (
    <div>
      <CodeMirrorTypescriptEditor
        jsx
        value={handlerSourceCode}
        readOnly
        onChange={() => {}}
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
      <div className="rounded-md border mt-1 px-1 pt-1 pb-2 shadow-sm">
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
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold my-2 text-gray-400" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-semibold my-2 text-gray-400"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-md font-semibold mt-2 mb-1 text-gray-300"
              {...props}
            />
          ),
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
