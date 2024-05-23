import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
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
import { getVSCodeLinkFromCallerLocaiton, getVSCodeLinkFromError } from "@/queries/vscodeLinks";
import { CaretSortIcon, CodeIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { Fragment, ReactNode, useEffect, useState } from "react";

export const RequestSheet = ({ trace }: { trace: MizuTrace }) => {
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
            <Button type="button" variant="secondary">Close</Button>
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

const LogCard = ({children}: { children: React.ReactNode }) => {
  return (
    <div className="rounded-md border mt-2 px-4 pt-2 pb-3 font-mono text-sm shadow-sm">
      {children}
    </div>
  )
}

const RequestLog = ({ log }: { log: MizuLog }) => {
  const description = `${log.message.method} ${log.message.path}`

  return (
    <LogCard>
      <LogDetailsHeader log={log} eventName="Incoming Request" description={description} />
      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}

const ResponseLog = ({ log }: { log: MizuLog }) => {
  const description = `${log.message.status} ${log.message.method} ${log.message.path}
`
  return (
    <LogCard>
      <LogDetailsHeader eventName="Outgoing Response"  log={log} description={description}  />
      <div className="mt-2">
        <KeyValueGrid data={log.message} />
      </div>
    </LogCard>
  )
}
function useCallerLocation(log: MizuLog) {
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);
  useEffect(() => {
    if (log.callerLocation) {
      getVSCodeLinkFromCallerLocaiton(log.callerLocation).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [log.callerLocation])

  return vsCodeLink;
}

function getMagicSuggesttion({ log, trace }: { log: MizuLog, trace?: MizuTrace }) {
  if (log.message?.message === "process is not defined") {
    return "Change process.env to c.env"
  }
  if (log.message?.message === "No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?") {
    return "Add a database connection string to `.dev.vars`. If you already did this, make sure to restart your dev server!"
  }
  return null;
}

const ErrorLog = ({ log }: { log: MizuLog }) => {
  const description = `${log.message.message}`;
  const magicSuggestion = getMagicSuggesttion({ log });

  const stack = log.message.stack;
  const [vsCodeLink, setVSCodeLink] = useState<string | null>(null);
  useEffect(() => {
    if (stack) {
      getVSCodeLinkFromError({ stack }).then((link) => {
        setVSCodeLink(link)
      })
    }
  }, [stack])


  return (
    <LogCard>
      <LogDetailsHeader eventName="Error" log={log} description={description} />

      <div>
        {magicSuggestion && (
          <MagicSuggestion suggestion={magicSuggestion} />
        )}

        {vsCodeLink && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" className="w-full">
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
    </LogCard>
  )
}

const InfoLog = ({ log }: { log: MizuLog }) => {
  const description = `${log.message}`
  const vsCodeLink = useCallerLocation(log);
  return (
    <LogCard>
      <LogDetailsHeader eventName="console.log" log={log} description={""} />
      <div className="mt-2 font-sans">
        {log.message}
      </div>
      <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-500 hover:text-gray-700 ">
        {JSON.stringify(log.args, null, 2)}
      </div>

      {vsCodeLink && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" className="w-full">
            <CodeIcon className="mr-2" />
            <a href={vsCodeLink}>Go to Code</a>
          </Button>
        </div>
      )}
    </LogCard>
  )
}

const MagicSuggestion = ({ suggestion, children }: { suggestion: string; children?: ReactNode  }) => {
  return (
    <div className="font-sans rounded-lg border border-purple-400 bg-purple-50 mt-4 px-2 py-3 text-sm shadow-md">
      <div className="grid grid-cols-[auto_1fr] gap-y-1 gap-x-2">
        <div className="text-purple-800 flex items-center">
          <MagicWandIcon className="h-3.5 w-3.5" /> {/* Adjusted icon size for better visual balance */}
        </div>
        <div className="text-left flex items-center">
          <div className="text-purple-800">
            <span className="font-semibold mr-2">Suggestion</span>
          </div>
        </div>
        <div/>
        <div className="text-purple-800">
          <span>{suggestion}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

const LogDetailsHeader = ({ eventName, description, log }: { eventName: string; description: string; log: MizuLog }) => {
  return (
    <div>
      <div className="font-mono text-gray-500 w-full flex flex-col sm:flex-row md:space-0 justify-between items-center">
        <div className="font-bold" style={{ marginLeft: "-.625rem"}}> { /* HACK - Do this properly eventually */}
          <Badge className="mr-2" variant="secondary">
            {eventName}
          </Badge>
        </div>
        <span className="text-xs my-1 sm:my-0">[{log.timestamp}]</span>
        <span className="hidden">
          {log.traceId}
        </span>
      </div>
      {description && (<div className="mt-1">
        {description}
      </div>)}
      
    </div>
  
  )
};

type KVGridProps = { [key: string]: any }
const KeyValueGrid: React.FC<KVGridProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { lifecycle, method, path } = data; // TODO - extract these
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 ">
        {/* <h4 className="text-sm font-semibold">
          Context
        </h4> */}
        <CollapsibleTrigger asChild>
          <Button className="group p-0 h-4 text-cyan-700" variant="link" size="sm">
            Show {isOpen ? "Less" : "More"}
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Show {isOpen ? "Less" : "More"}</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <Separator className="my-1" />
        <div className="flex flex-col gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div className="font-mono font-semibold text-gray-600">
                {key}
              </div>
              <div className="font-sans text-gray-800 max-h-[200px] overflow-y-auto mt-1">
                {key === "env" ? <EnvGrid env={value} /> : key === "headers" ? <EnvGrid env={value} /> : typeof value === "string" ? value : JSON.stringify(value, null, 2)}
              </div>
              <Separator className="my-1" />

            </div>
            
          ))}
        </div>
      </CollapsibleContent>

    </Collapsible>
  );
};

const EnvGrid = ({ env }: { env: Record<string, string> }) => {
  return (
    <div className="flex flex-col">
      {Object.entries(env).map(([key, value]) => {
        return (
          <div className="mt-2 font-mono" key={key}>
            <div className="col-span-1 font-semibold text-xs">
              {key}
            </div>
            <div className="col-span-1 text-mono">
              {value}
            </div>
          </div>
          
        )
      })}
    </div>
  )
}

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