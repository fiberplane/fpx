import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MizuTrace, MizuLog } from "@/queries/decoders";
import { getVSCodeLink } from "@/queries/vscodeLinks";
import { CaretSortIcon, CodeIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { Fragment, useEffect, useState } from "react";

export const TraceSheet = ({ trace }: { trace: MizuTrace }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="px-2 py-0" variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[540px] sm:w-[540px] md:max-w-[680px] md:w-[680px] lg:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Details</SheetTitle>
          <SheetDescription>
            Inspect logs from the request here
          </SheetDescription>
        </SheetHeader>
        <TraceDetails trace={trace} />
        <SheetFooter>
          <SheetClose asChild className="mt-4">
            <Button type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
};

export const TraceDetails = ({ trace }: { trace: MizuTrace }) => {
  return (
    <>
      {trace.logs.map(log => (
        <LogDetails log={log} key={log.id} />
      ))}
    </>
  )
}

const RequestLog = ({ log }: { log: MizuLog }) => {
  const message = `Incoming Request: ${log.message.method} ${log.message.path}`

  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <LogDetailsHeader log={log} />

      <LogDetailsMainMessage message={message} />

      <div className="mt-4">
        <KeyValueGrid data={log.message} />
      </div>
    </div>
  )
}

const ResponseLog = ({ log }: { log: MizuLog }) => {
  const message = `Outgoing Response: ${log.message.status} ${log.message.method} ${log.message.path}
`
  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <LogDetailsHeader log={log} />
      <LogDetailsMainMessage message={message} />
      <div className="mt-4">
        <KeyValueGrid data={log.message} />
      </div>
    </div>
  )
}

const ErrorLog = ({ log }: { log: MizuLog }) => {
  const message = `Error: ${log.message.message}`;
  const magicSuggestion = log.message?.message === "process is not defined" ? "Change process.env to c.env" : null;

  const stack = log.message.stack;
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);
  useEffect(() => {
    if (stack) {
      getVSCodeLink({ stack }).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [stack])


  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <LogDetailsHeader log={log} />

      <div>
        <LogDetailsMainMessage message={message} />
        {magicSuggestion && (
          <MagicSuggestion suggestion={magicSuggestion} />
        )}

        {vsCodeLink && (
          <div className="mt-2">
            <Button size="sm">
              <CodeIcon className="mr-2" />
              <a href={vsCodeLink}>Go to Code</a>
            </Button>
          </div>
        )}


        <div className="mt-2 font-bold">
          Stack Trace
        </div>
        <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-500 hover:text-gray-700 ">
          {log.message.stack}
        </div>
      </div>
    </div>
  )
}

const InfoLog = ({ log }: { log: MizuLog }) => {
  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      <LogDetailsHeader log={log} />
      <div>
        Info: {log.message}
      </div>
    </div>
  )
}

const MagicSuggestion = ({ suggestion }: { suggestion: string }) => {
  return (
    <div className="font-sans rounded-md border mt-2 px-4 py-2 text-sm shadow-sm">
      <div className="text-left">
        <div className="text-gray-600 flex items-center">
          <MagicWandIcon className="mr-2"/>
          <span className="font-semibold mr-2">Suggestion:</span> <span>{suggestion}</span>
        </div>
      </div>
    </div>
  )
}

const LogDetailsHeader = ({ log }: { log: MizuLog }) => {
  return (
    <div className="text-right font-mono text-gray-500 w-full text-xs">
      <span>[{log.timestamp}]</span>
      <span className="hidden">
        {log.traceId}
      </span>
    </div>
  )
};

const LogDetailsMainMessage = ({ message }: { message: string }) => {
  return (
    <div className="font-bold">
      {message}
    </div>
  )
}

type KVGridProps = { [string]: any }
const KeyValueGrid: React.FC<KVGridProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4">
        {/* <h4 className="text-sm font-semibold">
          Context
        </h4> */}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            Show More
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Show More</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <Fragment key={key}>
              <div className="col-span-1 font-mono text-gray-600">
                {key}:
              </div>
              <div className="col-span-2 font-sans text-gray-800">
                {JSON.stringify(value, null, 2)}
              </div>
            </Fragment>
          ))}
        </div>
      </CollapsibleContent>

    </Collapsible>
  );
};

export const LogDetails = ({ log }: { log: MizuLog }) => {
  const { message } = log;

  if (message?.lifecycle === "request") {
    return <RequestLog log={log} />
  }

  if (message?.lifecycle === "response") {
    return <ResponseLog log={log} />
  }

  if (typeof message === "object" && "message" in message) {
    return <ErrorLog log={log} />
  }

  if (typeof message === "string") {
    return <InfoLog log={log} />
  }

  return (
    <div className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
      {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
        return (
          <div key={key} className="rounded-md border mt-2 px-4 py-2 font-mono text-sm shadow-sm">
            {key}: {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
          </div>
        )
      })}
    </div>
  )
};