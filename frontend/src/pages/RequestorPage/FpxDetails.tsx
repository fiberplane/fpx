import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  isMizuRequestEndMessage,
  isMizuRequestStartMessage,
  useHandlerSourceCode,
  useMizuTraces,
} from "@/queries";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { CodeMirrorTypescriptEditor } from "./Editors/CodeMirrorEditor";
import { HeaderTable } from "./HeaderTable";
import { Requestornator } from "./queries";
import { EventsTable } from "./EventsTable";

type FpxDetailsProps = {
  response?: Requestornator;
};

export function FpxDetails({ response }: FpxDetailsProps) {
  const hasTrace = !!response?.app_responses?.traceId;
  return (
    <div>{hasTrace ? <TraceDetails response={response} /> : "no trace"}</div>
  );
}

type TraceDetailsProps = {
  response: Requestornator;
};

function useTrace(traceId: string) {
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

function TraceDetails({ response }: TraceDetailsProps) {
  const traceId = response.app_responses.traceId;
  const { trace, isNotFound } = useTrace(traceId);

  if (isNotFound) {
    return <div>Trace not found</div>;
  }

  // console.log("HI FOUND TRACE!", trace);
  const fpxRequestMessage = getRequestMessage(trace?.logs || []);
  const fpxResponseMessage = getResponseMessage(trace?.logs || []);
  const shouldShowSourceFunction = fpxRequestMessage && fpxResponseMessage;

  return (
    <div>
      {/* <code>{JSON.stringify(request, null, 2)}</code> */}
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
