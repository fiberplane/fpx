import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// import { Skeleton } from "@/components/ui/skeleton";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import { CaretSortIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { useRequestWaterfall } from "../RequestDetailsPage/RequestDetailsPageV2/useRequestWaterfall";
import { TraceDetailsTimeline } from "../RequestDetailsPage/v2";
import {
  getRequestEnv,
  getRequestHeaders,
} from "../RequestDetailsPage/v2/otel-helpers";
import { EventsTable } from "./EventsTable";
import { HeaderTable } from "./HeaderTable";
import { Requestornator } from "./queries";

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
  const traceId = response.app_responses.traceId;
  const { data: spans, error, isLoading } = useOtelTrace(traceId);
  const isNotFound = !spans && !error && !isLoading;

  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useRequestWaterfall(spans ?? [], orphanLogs);

  if (isNotFound) {
    return <div>Trace not found</div>;
  }

  const requestSpan = spans?.find((span) => span.name === "request");
  const headersReceived = requestSpan ? getRequestHeaders(requestSpan) : {};
  const requestEnv = requestSpan ? getRequestEnv(requestSpan) : {};

  // TODO - Implement this in the middleware
  // const shouldShowSourceFunction = false;

  const events = spans?.flatMap((span) => span.events) ?? [];

  return (
    <div className={cn("mt-2", className)}>
      <div className="w-full">
        <TraceDetailsTimeline waterfall={waterfall} className="pt-0 -mt-2" />
      </div>
      <Section title="Events" defaultIsOpen>
        <EventsTable events={events} />
      </Section>
      <Section title="Environment">
        <HeaderTable headers={requestEnv ?? {}} />
      </Section>
      <Section title="Headers Your API Received">
        <HeaderTable headers={headersReceived} />
      </Section>
      {/* {shouldShowSourceFunction && (
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
      )} */}
    </div>
  );
}

// type SourceFunctionProps = {
//   fpxRequestMessage: MizuRequestStart;
//   fpxResponseMessage: MizuRequestEnd;
// };
// function SourceFunction({
//   fpxRequestMessage,
//   fpxResponseMessage,
// }: SourceFunctionProps) {
//   const source = fpxRequestMessage?.file;
//   const handler = fpxResponseMessage?.handler;
//   const handlerSourceCode = useHandlerSourceCode(source, handler) ?? "";

//   return (
//     <div>
//       <CodeMirrorTypescriptEditor
//         jsx
//         value={handlerSourceCode}
//         readOnly
//         onChange={noop}
//         minHeight="100px"
//       />
//     </div>
//   );
// }

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
